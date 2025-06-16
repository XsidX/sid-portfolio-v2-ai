import { appendClientMessage, createDataStream, smoothStream, streamText } from "ai"
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

          // Use a single streamText call with all tools and let the AI handle the chaining
          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: `You are an AI assistant that helps answer questions about Sid(Sidney Kaguli), in his portfolio website.

              Your process should be:
              1. First, use the getTopicNames tool to see what topics are available
              2. Based on the user's query "${messageContent}", select the most relevant topic
              3. Then use the readAboutSid tool with that selected topic to get detailed information
              4. Finally, use that information to provide a comprehensive answer to the user's question

              User's question: "${messageContent}"

              Follow the 3-step process above to provide the best possible answer.`,
            messages,
            tools: {
              getTopicNamesTool,
              readAboutSidTool,
            },
            maxSteps: 10, // Allow multiple steps for the chaining
            experimental_transform: smoothStream({ chunking: "word" }),
            experimental_generateMessageId: generateUUID,
          })

          result.consumeStream()
          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          })
        } catch (error) {
          console.error("Error in agent chaining:", error)
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
