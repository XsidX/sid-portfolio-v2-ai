import {
    appendClientMessage,
    createDataStream,
    smoothStream,
    streamText,
  } from 'ai';
  import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
  import { generateUUID } from '@/lib/utils';
  import { getWeather } from '@/lib/ai/tools/get-weather';
  import { myProvider } from '@/lib/ai/providers';
  import { postRequestBodySchema, type PostRequestBody } from './schema';
  import { geolocation } from '@vercel/functions';
  import {
    createResumableStreamContext,
    type ResumableStreamContext,
  } from 'resumable-stream';
  import { after } from 'next/server';
  
  export const maxDuration = 60;
  
  let globalStreamContext: ResumableStreamContext | null = null;
  
  function getStreamContext() {
    if (!globalStreamContext) {
      try {
        globalStreamContext = createResumableStreamContext({
          waitUntil: after,
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.message.includes('REDIS_URL')) {
          console.log(
            ' > Resumable streams are disabled due to missing REDIS_URL',
          );
        } else {
          console.error(error);
        }
      }
    }
  
    return globalStreamContext;
  }
  
  export async function POST(request: Request) {
    let requestBody: PostRequestBody;
  
    try {
      const json = await request.json();
      requestBody = postRequestBodySchema.parse(json);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return new Response('Invalid request body', { status: 400 });
    }
  
    try {
      const { message, selectedChatModel } = requestBody;
  
      const messages = appendClientMessage({
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(' > Resumable streams are disabled due to missing REDIS_URL');
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new Response('Invalid request body', { status: 400 });
  }

  try {
    const { message, selectedChatModel } = requestBody;

    const messages = appendClientMessage({
      messages: [],
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      model: myProvider.languageModel(selectedChatModel),
      system: systemPrompt({ selectedChatModel, requestHints }),
      messages,
      maxSteps: 5,
      experimental_activeTools:
        selectedChatModel === 'chat-model-reasoning'
          ? []
          : ['getWeather'],
      experimental_transform: smoothStream({ chunking: 'word' }),
      experimental_generateMessageId: generateUUID,
      tools: {
        getWeather,
      },
    };

    const stream = createDataStream({
      execute: async (dataStream) => {
        try {
          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPrompt({ selectedChatModel, requestHints }),
            messages,
            maxSteps: 5,
            experimental_activeTools:
              selectedChatModel === 'chat-model-reasoning'
                ? []
                : ['getWeather'],
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            tools: {
              getWeather,
            },
          });

          result.consumeStream();

          await result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
        } catch (error) {
          console.error('Error in stream execution:', error);
          dataStream.append({ type: 'text-delta', textDelta: 'Sorry, an error occurred while processing your request.' });
          dataStream.close();
        }
      },
      onError: (error) => {
        console.error('Stream error:', error);
        return 'Sorry, an error occurred while processing your request.';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
        return new Response(
          await streamContext.resumableStream(streamId, () => stream),
        );
      } else {
        return new Response(stream);
      }
    } catch (error) {
      console.error(error);
      return new Response('An error occurred while processing your request!', {
        status: 500,
      });
    }
  }
  