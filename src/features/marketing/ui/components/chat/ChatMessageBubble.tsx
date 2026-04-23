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
          ? 'rounded-br-md bg-linear-to-br from-emerald-600 to-emerald-700 text-white'
          : 'rounded-bl-md border border-emerald-100 bg-white text-slate-800'
      }`}
    >
      <div className="px-2 py-1 text-sm leading-relaxed whitespace-pre-line">
        {message.text}
      </div>

      <div
        className={`mt-1 flex items-center justify-end gap-1 text-xs ${
          message.type === 'user'
            ? 'text-emerald-100/80'
            : 'text-gray-400'
        } px-1`}
      >
        <span>{timeLabel}</span>
        {message.type === 'user' && <CheckCheck className="h-3 w-3" />}
      </div>
    </div>
  )
}
