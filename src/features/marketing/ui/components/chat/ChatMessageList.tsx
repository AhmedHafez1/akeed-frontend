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
      className="h-110 space-y-3 overflow-y-auto scroll-smooth p-4"
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
            <div className="flex max-w-[85%] flex-col gap-1">
              <ChatMessageBubble
                message={message}
                timeLabel={`09:4${(index % 5) + 1}`}
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
