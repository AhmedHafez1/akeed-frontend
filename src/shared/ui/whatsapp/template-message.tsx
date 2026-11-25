import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { WhatsAppMessageBubble } from './message-bubble'
import {
  WhatsAppTemplateButtons,
  type WhatsAppReplyTone,
  type WhatsAppTemplateButton,
} from './reply-buttons'

interface WhatsAppTemplateMessageProps {
  children: ReactNode
  timeLabel: string
  buttons: ReadonlyArray<WhatsAppTemplateButton>
  pressedTone?: WhatsAppReplyTone
  className?: string
}

/**
 * An incoming business template message with its reply buttons underneath,
 * on one bubble background, as WhatsApp shows it.
 */
export function WhatsAppTemplateMessage({
  children,
  timeLabel,
  buttons,
  pressedTone,
  className,
}: WhatsAppTemplateMessageProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl rounded-ss-sm bg-white shadow-sm dark:bg-[#202c33]',
        className
      )}
    >
      <WhatsAppMessageBubble
        direction="incoming"
        timeLabel={timeLabel}
        className="px-2 shadow-none"
      >
        {children}
      </WhatsAppMessageBubble>
      <WhatsAppTemplateButtons buttons={buttons} pressedTone={pressedTone} />
    </div>
  )
}
