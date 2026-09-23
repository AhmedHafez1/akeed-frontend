import { motion } from 'framer-motion'
import {
  WhatsAppQuickReplyIcon,
  whatsAppQuickReplyClassName,
} from '@/shared/ui/whatsapp'
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
        const tone = btn.action === 'confirm' ? 'confirm' : 'cancel'
        const isSelected = message.selectedAction === btn.action

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
            className={whatsAppQuickReplyClassName(tone)}
            disabled={isPast}
            aria-hidden
          >
            <WhatsAppQuickReplyIcon tone={tone} />
            {btn.text}
          </motion.button>
        )
      })}
    </div>
  )
}
