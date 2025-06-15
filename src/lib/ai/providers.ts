import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { google } from '@ai-sdk/google';
import { isTestEnvironment } from '../constants';
import {
  chatModel,
  reasoningModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': google('gemini-2.0-flash-lite'),
        'chat-model-reasoning': wrapLanguageModel({
          model: google('gemini-2.0-flash-lite'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
      },
    });
