import { appendClientMessage, createDataStream, smoothStream, streamText, generateText } from "ai"
import { generateUUID } from "@/lib/utils"
import { myProvider } from "@/lib/ai/providers"
import { postRequestBodySchema, type PostRequestBody } from "./schema"
import { createResumableStreamContext, type ResumableStreamContext } from "resumable-stream"
import { after } from "next/server"
import { getTopicNamesTool, readAboutSidTool } from "@/lib/ai/tools/sid"

export const maxDuration = 60

let globalStreamContext: ResumableStreamContext | null = null

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(" > Resumable streams are disabled due to missing REDIS_URL")
      } else {
        console.error(error)
      }
    }
  }

  return globalStreamContext
}

// Agent 1: Topic Selection - Improved with better analysis
const topicSelectionPrompt = (originalQuery: string) => `
You are a topic selection agent. Your task is to analyze the user's query and select the most relevant topic from available topics.

User Query: "${originalQuery}"

Instructions:
1. First, use the getTopicNames tool to get all available topics
2. Carefully analyze the user's query to understand what they're asking about
3. Compare the user's query with each available topic to find the best match
4. Consider keywords, context, and intent when matching
5. Select the topic that would most likely contain information to answer the user's question
6. Respond with ONLY the exact topic name from the available list - nothing else

Examples:
- If user asks "What's your background?" and topics include ["experience", "education", "skills"] → select "experience"
- If user asks "Tell me about your projects" and topics include ["projects", "experience", "skills"] → select "projects"
- If user asks "What technologies do you know?" and topics include ["skills", "projects", "experience"] → select "skills"

Be precise and select the topic that best matches the user's intent.`

// Agent 2: Content Retrieval
const contentRetrievalPrompt = (
  selectedTopic: string,
) => `You are a content retrieval agent. Your job is to gather comprehensive information about the topic: "${selectedTopic}".

Instructions:
1. Use the readAboutSid tool with the exact topic name "${selectedTopic}"
2. Return the complete information you retrieve - do not summarize or filter it
3. Your role is purely to fetch and return the raw content

Topic to research: "${selectedTopic}"`

// Agent 3: Response Generation
const responseGenerationPrompt = (
  originalQuery: string,
  selectedTopic: string,
  retrievedContent: string,
) => `You are an AI assistant that helps answer questions about Sid(Sidney Kaguli), in his portfolio website.

Original User Query: "${originalQuery}"
Selected Topic: "${selectedTopic}"
Retrieved Content: "${retrievedContent}"

Your task is to:
1. Use the retrieved content as your knowledge base
2. Answer the user's original query comprehensively using this information
3. Provide a helpful, detailed response that directly addresses what the user asked
4. If the retrieved content doesn't fully answer the query, acknowledge this and provide what information you can

Do NOT use any tools. Simply use the provided content to generate your response.

User's question: "${originalQuery}"
Answer based on the retrieved content about "${selectedTopic}".`

export async function POST(request: Request) {
  let requestBody: PostRequestBody

  try {
    const json = await request.json()
    requestBody = postRequestBodySchema.parse(json)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return new Response("Invalid request body", { status: 400 })
  }

  try {
    const { message, selectedChatModel } = requestBody

    // Extract the content from the message object
    const messageContent = typeof message === "string" ? message : message.content

    const messages = appendClientMessage({
      messages: [],
      message,
    })

    const streamId = generateUUID()

    const stream = createDataStream({
      execute: async (dataStream) => {
        try {
          // Skip chaining for reasoning model
          if (selectedChatModel === "chat-model-reasoning") {
            const result = streamText({
              model: myProvider.languageModel(selectedChatModel),
              system: `
              - You are an AI assistant that helps answer questions about Sid(Sidney Kaguli), in his portfolio website.
              `,
              messages,
              maxSteps: 5,
              experimental_activeTools: [],
              experimental_transform: smoothStream({ chunking: "word" }),
              experimental_generateMessageId: generateUUID,
            })

            result.consumeStream()
            result.mergeIntoDataStream(dataStream, {
              sendReasoning: true,
            })
            return
          }

          // AGENT 1: Topic Selection
          dataStream.writeData({
            type: "status",
            message: "🔍 Step 1: Analyzing query and selecting relevant topic...",
          })

          const topicSelectionResult = await generateText({
            model: myProvider.languageModel(selectedChatModel),
            system: topicSelectionPrompt(messageContent),
            messages,
            tools: {
              getTopicNamesTool,
            },
            maxSteps: 5,
          })

          console.log("Topic selection result:", topicSelectionResult)

          // Extract available topics first
          let availableTopics: string[] = []
          if (topicSelectionResult.toolResults && topicSelectionResult.toolResults.length > 0) {
            const topicNamesResult = topicSelectionResult.toolResults.find(
              (result) => result.toolName === "getTopicNamesTool",
            )

            if (topicNamesResult && topicNamesResult.result) {
              availableTopics = Array.isArray(topicNamesResult.result)
                ? topicNamesResult.result
                : [topicNamesResult.result]
            }
          }

          console.log("Available topics:", availableTopics)

          // Extract the selected topic with improved matching
          let selectedTopic = ""
          const generatedText = topicSelectionResult.text.trim().toLowerCase()
          console.log("Generated topic selection text:", generatedText)

          if (availableTopics.length > 0) {
            // Try exact match first (case insensitive)
            selectedTopic = availableTopics.find((topic) => topic.toLowerCase() === generatedText) || ""

            // If no exact match, try to find the topic mentioned in the generated text
            if (!selectedTopic) {
              selectedTopic = availableTopics.find((topic) => generatedText.includes(topic.toLowerCase())) || ""
            }

            // If still no match, try reverse - see if any topic is contained in the generated text
            if (!selectedTopic) {
              selectedTopic = availableTopics.find((topic) => topic.toLowerCase().includes(generatedText)) || ""
            }

            // Smart matching based on user query intent
            if (!selectedTopic) {
              const queryLower = messageContent.toLowerCase()

              // Define keyword mappings for better topic selection
              const topicKeywords: Record<string, string[]> = {
                experience: ["experience", "work", "job", "career", "background", "history", "professional"],
                projects: ["project", "build", "created", "developed", "portfolio", "work", "app", "website"],
                skills: [
                  "skill",
                  "technology",
                  "tech",
                  "programming",
                  "language",
                  "framework",
                  "tool",
                  "know",
                  "learn",
                ],
                education: ["education", "school", "university", "degree", "study", "learn", "academic"],
                about: ["about", "who", "introduction", "bio", "background", "tell me"],
                contact: ["contact", "reach", "email", "phone", "connect", "get in touch"],
              }

              // Find the best matching topic based on keywords
              let bestMatch = ""
              let maxMatches = 0

              for (const topic of availableTopics) {
                const topicLower = topic.toLowerCase()
                const keywords = topicKeywords[topicLower] || [topicLower]

                const matches = keywords.filter((keyword) => queryLower.includes(keyword)).length

                if (matches > maxMatches) {
                  maxMatches = matches
                  bestMatch = topic
                }
              }

              if (bestMatch && maxMatches > 0) {
                selectedTopic = bestMatch
              }
            }

            // Final fallback to first topic if nothing matches
            if (!selectedTopic && availableTopics.length > 0) {
              selectedTopic = availableTopics[0]
              console.log("Using fallback topic:", selectedTopic)
            }
          }

          // Last resort: use generated text as topic name
          if (!selectedTopic && topicSelectionResult.text) {
            selectedTopic = topicSelectionResult.text.trim()
          }

          if (!selectedTopic) {
            throw new Error("No topic could be selected")
          }

          console.log("Final selected topic:", selectedTopic)
          console.log("User query was:", messageContent)

          dataStream.writeData({
            type: "topic_selected",
            topic: selectedTopic,
            availableTopics: availableTopics,
            message: `📋 Selected topic: ${selectedTopic} (from ${availableTopics.length} available topics)`,
          })

          // AGENT 2: Content Retrieval
          dataStream.writeData({
            type: "status",
            message: `📚 Step 2: Retrieving information about "${selectedTopic}"...`,
          })

          const contentRetrievalMessages = appendClientMessage({
            messages: [],
            message: {
              id: generateUUID(),
              createdAt: new Date(),
              role: "user" as const,
              content: `Retrieve information about: ${selectedTopic}`,
            },
          })

          const contentRetrievalResult = await generateText({
            model: myProvider.languageModel(selectedChatModel),
            system: contentRetrievalPrompt(selectedTopic),
            messages: contentRetrievalMessages,
            tools: {
              readAboutSidTool,
            },
            maxSteps: 5,
          })

          console.log("Content retrieval result:", contentRetrievalResult)

          // Extract the retrieved content
          let retrievedContent = ""

          if (contentRetrievalResult.toolResults && contentRetrievalResult.toolResults.length > 0) {
            const readAboutSidResult = contentRetrievalResult.toolResults.find(
              (result) => result.toolName === "readAboutSidTool",
            )

            if (readAboutSidResult && readAboutSidResult.result) {
              retrievedContent =
                typeof readAboutSidResult.result === "string"
                  ? readAboutSidResult.result
                  : JSON.stringify(readAboutSidResult.result)
            }
          }

          // Fallback to generated text if no tool result
          if (!retrievedContent && contentRetrievalResult.text) {
            retrievedContent = contentRetrievalResult.text
          }

          if (!retrievedContent) {
            retrievedContent = `No specific information found about ${selectedTopic}`
          }

          console.log("Retrieved content length:", retrievedContent.length)

          dataStream.writeData({
            type: "content_retrieved",
            content: retrievedContent.substring(0, 200) + "...", // Preview
            message: `📖 Retrieved ${retrievedContent.length} characters of information about "${selectedTopic}"`,
          })

          // AGENT 3: Response Generation
          dataStream.writeData({
            type: "status",
            message: "✍️ Step 3: Generating comprehensive response...",
          })

          const responseMessages = appendClientMessage({
            messages: [],
            message: {
              id: generateUUID(),
              createdAt: new Date(),
              role: "user" as const,
              content: messageContent, // Original user query
            },
          })

          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: responseGenerationPrompt(messageContent, selectedTopic, retrievedContent),
            messages: responseMessages,
            maxSteps: 3, // No tools needed for final response
            experimental_transform: smoothStream({ chunking: "word" }),
            experimental_generateMessageId: generateUUID,
          })

          result.consumeStream()
          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          })
        } catch (error) {
          console.error("Error in agent chaining:", error)
          dataStream.writeData({
            type: "error",
            message: `An error occurred during processing: ${error}`,
          })
        }
      },
      onError: (error) => {
        console.error("Error in stream execution:", error)
        return "Oops, an error occurred!"
      },
    })

    const streamContext = getStreamContext()

    if (streamContext) {
      return new Response(await streamContext.resumableStream(streamId, () => stream))
    } else {
      return new Response(stream)
    }
  } catch (error) {
    console.error(error)
    return new Response("An error occurred while processing your request!", {
      status: 500,
    })
  }
}