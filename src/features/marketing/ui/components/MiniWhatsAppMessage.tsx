'use client'

import { BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/shared/lib/utils'
import {
  WhatsAppTemplateMessage,
  type WhatsAppReplyTone,
} from '@/shared/ui/whatsapp'
import { useMockupTemplate } from './useMockupTemplate'

interface MiniWhatsAppMessageProps {
  text: string
  /** The reply shown as tapped; none leaves both buttons plain. */
  pressedTone?: WhatsAppReplyTone
  className?: string
}

/**
 * A small WhatsApp chat card: the Akeed business header and one confirmation
 * message with its two reply buttons, labelled as the real template is.
 */
export function MiniWhatsAppMessage({
  text,
  pressedTone,
  className,
}: MiniWhatsAppMessageProps) {
  const { template, direction, language } = useMockupTemplate()

  return (
    <div
      className={cn(
        'bg-muted ring-border flex flex-col overflow-hidden rounded-2xl ring-1',
        className
      )}
    >
      <div className="bg-card border-border flex items-center gap-2.5 border-b px-4 py-3">
        <span className="bg-primary-subtle flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
          <Image
            src="/images/akeed-social-profile-circle-1080.png"
            alt=""
            width={32}
            height={32}
            sizes="32px"
          />
        </span>
        <span className="text-foreground font-semibold">Akeed</span>
        <BadgeCheck aria-hidden className="text-info h-4 w-4" />
      </div>
      <div
        dir={direction}
        lang={language}
        className="flex flex-1 flex-col justify-center px-4 py-5"
      >
        <WhatsAppTemplateMessage
          timeLabel="10:30"
          buttons={[
            { label: template.confirm, tone: 'confirm' },
            { label: template.cancel, tone: 'cancel' },
          ]}
          pressedTone={pressedTone}
        >
          {text}
        </WhatsAppTemplateMessage>
      </div>
    </div>
  )
}
