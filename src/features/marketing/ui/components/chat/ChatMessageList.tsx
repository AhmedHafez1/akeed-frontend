import { AnimatePresence, motion } from 'framer-motion'
import type { RefObject } from 'react'
import { DemoMessage } from './demo-message.model'
import { ChatMessageBubble } from './ChatMessageBubble'
import { ChatQuickReplies } from './ChatQuickReplies'
import { ChatTypingIndicator } from './ChatTypingIndicator'

interface ChatMessageListProps {
  messages: DemoMessage[]
  isTyping: boolean
  scrollRef: RefObject<HTMLDivElement | null>
}

export function ChatMessageList({
  messages,
  isTyping,
  scrollRef,
}: ChatMessageListProps) {
  return (
    <div
      ref={scrollRef}
      className="h-88 space-y-3 overflow-y-auto scroll-smooth px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex flex-col gap-1 ${
                message.buttons
                  ? 'w-[92%] rounded-xl rounded-ss-sm bg-white pb-2 shadow-sm dark:bg-[#202c33] [&>div:first-child]:shadow-none [&>div:last-child]:px-2'
                  : 'max-w-[85%]'
              }`}
            >
              <ChatMessageBubble
                message={message}
                timeLabel={`10:2${(index * 3 + 4) % 10}`}
              />

              <ChatQuickReplies
                message={message}
                messageIndex={index}
                totalMessages={messages.length}
                isTyping={isTyping}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isTyping && <ChatTypingIndicator />}
    </div>
  )
}
