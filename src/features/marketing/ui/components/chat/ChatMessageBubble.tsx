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
  return (
    <div
      className={`rounded-2xl p-2 shadow-sm ${
        message.type === 'user'
          ? 'rounded-br-md bg-[#dcf8c6] text-slate-800' // real whatsapp bg
          : 'rounded-bl-md bg-white text-slate-800'
      }`}
    >
      <div className="px-2 py-1 text-sm leading-relaxed whitespace-pre-line">
        {message.text}
      </div>

      <div
        className={`mt-1 flex items-center justify-end gap-1 px-1 text-xs text-gray-400`}
      >
        <span>{timeLabel}</span>
        {message.type === 'user' && <CheckCheck className="h-3 w-3" />}
      </div>
    </div>
  )
}
