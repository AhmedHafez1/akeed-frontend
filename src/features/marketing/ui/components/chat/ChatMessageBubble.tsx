import { CheckCheck } from 'lucide-react'
import { DemoMessage } from './demo-message.model'

interface ChatMessageBubbleProps {
  message: DemoMessage
  timeLabel: string
}

export function ChatMessageBubble({
  message,
  timeLabel,
}: ChatMessageBubbleProps) {
  const isUser = message.type === 'user'

  return (
    <div
      className={`rounded-xl px-1 py-1 shadow-sm ${
        isUser
          ? 'rounded-se-sm bg-[#d9fdd3] text-slate-800' // WhatsApp outgoing
          : 'rounded-ss-sm bg-white text-slate-800'
      }`}
    >
      <div className="px-2 pt-1 text-[0.8125rem] leading-relaxed whitespace-pre-line">
        {message.text}
      </div>

      <div className="flex items-center justify-end gap-1 px-1.5 text-[0.625rem] text-slate-500">
        <span>{timeLabel}</span>
        {isUser && <CheckCheck className="h-3 w-3 text-sky-500" />}
      </div>
    </div>
  )
}
