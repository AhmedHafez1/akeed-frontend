import { WhatsAppMessageBubble } from '@/shared/ui/whatsapp'
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
    <WhatsAppMessageBubble
      direction={message.type === 'user' ? 'outgoing' : 'incoming'}
      timeLabel={timeLabel}
    >
      {message.text}
    </WhatsAppMessageBubble>
  )
}
