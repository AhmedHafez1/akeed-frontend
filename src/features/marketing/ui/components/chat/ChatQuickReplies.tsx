import { motion } from 'framer-motion'
import { SquareCheck, X } from 'lucide-react'
import { DemoMessage } from './demo-message.model'

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

  const isPast = messageIndex < totalMessages - 1
  const isHidden = !isPast && isTyping

  return (
    <div className="flex w-full flex-col gap-1.5 pt-0.5">
      {message.buttons.map((btn, idx) => {
        const isPrimary = btn.action === 'confirm'
        const isSelected = message.selectedAction === btn.action

        const toneClass = isPrimary
          ? 'bg-primary text-white shadow-sm'
          : 'bg-white text-primary ring-1 ring-slate-200 shadow-sm'

        return (
          <motion.button
            key={idx}
            type="button"
            tabIndex={-1}
            initial={{ opacity: 0, y: 5 }}
            animate={{
              opacity: isHidden ? 0 : isPast && !isSelected ? 0.55 : 1,
              y: 0,
            }}
            transition={{ delay: idx * 0.1 }}
            className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[0.8125rem] font-medium ${toneClass}`}
            disabled={isPast}
            aria-hidden
          >
            {isPrimary ? (
              <SquareCheck className="h-4 w-4" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            {btn.text}
          </motion.button>
        )
      })}
    </div>
  )
}
