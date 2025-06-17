import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from '@/components/chat/message';
// import { Greeting } from '@/components/chat/greeting';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'motion/react';
import { useMessages } from '@/hooks/use-messages';
import { ScrollArea } from '../ui/scroll-area';
import clsx from 'clsx';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  messages: Array<UIMessage>;
}

function PureMessages({
  chatId,
  status,
  messages,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 pt-4 relative"
    >
      <ScrollArea className={clsx({
        'h-[calc(100vh-300px)] md:h-[calc(100vh-440px)]': messages.length > 0,
        'h-[calc(100vh-800px)]': messages.length === 0,
      })}>
        {/* {messages.length === 0 && <Greeting />} */}

        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            message={message}
            requiresScrollPadding={
              hasSentMessage && index === messages.length - 1
            }
          />
        ))}

        {status === 'submitted' &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

        <motion.div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
          onViewportLeave={onViewportLeave}
          onViewportEnter={onViewportEnter}
        />

      </ScrollArea>
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  return true;
});