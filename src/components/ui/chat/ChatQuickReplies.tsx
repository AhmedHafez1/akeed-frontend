import { motion } from 'framer-motion'
import { DemoMessage } from '@/types/demo-message.model'

interface ChatQuickRepliesProps {
  message: DemoMessage
  messageIndex: number
  totalMessages: number
  isTyping: boolean
}

export function ChatQuickReplies({
  message,
  messageIndex,
  totalMessages,
  isTyping,
}: ChatQuickRepliesProps) {
  if (!message.buttons) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-1">
      {message.buttons.map((btn, idx) => {
        const isSelected = message.selectedAction === btn.action
        const isPast = messageIndex < totalMessages - 1

        let buttonStyle =
          'bg-white text-emerald-600 hover:bg-cyan-50 shadow-sm border-emerald-600'

        if (isPast) {
          if (isSelected) {
            buttonStyle =
              'bg-gray-100 text-gray-500 shadow-none ring-1 ring-gray-200 border-gray-200'
          }
        } else if (!isTyping && messageIndex === totalMessages - 1) {
          buttonStyle =
            'bg-white text-emerald-600 hover:bg-cyan-50 shadow-sm border-emerald-600'
        } else {
          buttonStyle = 'bg-white text-emerald-600 opacity-0 border-emerald-600'
        }

        return (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{
              opacity: isPast && !isSelected ? 0.6 : 1,
              y: 0,
            }}
            transition={{ delay: idx * 0.1 }}
            className={`w-full rounded-sm py-2.5 text-center text-sm font-medium transition-all active:scale-95 ${buttonStyle}`}
            disabled={isPast}
          >
            {btn.text}
          </motion.button>
        )
      })}
    </div>
  )
}
