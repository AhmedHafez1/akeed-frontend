'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { formatMoneyParts } from '@/shared/lib/money'
import {
  fillTemplateSegments,
  templateReplyTone,
  type TemplateMessage,
} from '@/shared/lib/templateMessage'
import { Skeleton } from '@/shared/ui'
import {
  WhatsAppChatHeader,
  WhatsAppPhoneFrame,
  WhatsAppPhonePreview,
} from '@/shared/ui/whatsapp'

/** Sample customer of the onboarding test, in the message's own language. */
export const SAMPLE_CUSTOMER_NAMES = { ar: 'أحمد', en: 'Ahmed' } as const
export const SAMPLE_ORDER_NUMBER = 'TEST-1'
export const SAMPLE_TOTAL_MINOR = 25000

interface MessagePhonePreviewProps {
  /** The message; null while it loads. */
  message: TemplateMessage | null
  /** The message could not be loaded. */
  isError?: boolean
  language: 'ar' | 'en'
  storeName: string
  currency: string
  customerName?: string
  orderNumber?: string
  totalMinor?: number
  /** When the message went out; now when it has not been sent. */
  sentAt?: string | null
  /** Draw the Confirm reply as the one thing to tap. */
  emphasizeConfirm?: boolean
  /** No message reached the phone (WhatsApp unavailable). */
  isEmpty?: boolean
  className?: string
}

/**
 * The confirmation message on a phone, filled with sample values: the
 * setup form's live preview and the test step's "what arrived" phone.
 */
export function MessagePhonePreview({
  message,
  isError = false,
  language,
  storeName,
  currency,
  customerName = SAMPLE_CUSTOMER_NAMES[language],
  orderNumber = SAMPLE_ORDER_NUMBER,
  totalMinor = SAMPLE_TOTAL_MINOR,
  sentAt,
  emphasizeConfirm = false,
  isEmpty = false,
  className,
}: MessagePhonePreviewProps) {
  const t = useTranslations('onboarding.test.phone')
  const tUnavailable = useTranslations('standaloneOnboarding.test.unavailable')

  const timeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        numberingSystem: 'latn',
      }).format(sentAt ? new Date(sentAt) : new Date()),
    [language, sentAt]
  )

  const paragraphs = useMemo(() => {
    if (!message) return []
    const { amount, currency: symbol } = formatMoneyParts(
      totalMinor,
      currency,
      language
    )
    return fillTemplateSegments(message, {
      customer: customerName,
      store: storeName.trim() || '…',
      // The order number never wraps at its hyphen.
      order: orderNumber.replace(/-/g, '\u2011'),
      total: `${amount} ${symbol.replace(/\.$/, '')}`,
    })
      .map((segments) =>
        segments
          .map((segment) =>
            // Isolated so "#TEST-1" and "250.00 ج.م" keep their order inside
            // the other script.
            segment.kind === 'variable' &&
            (segment.variable === 'order' || segment.variable === 'total')
              ? `\u2068${segment.text}\u2069`
              : segment.text
          )
          .join('')
      )
      .filter((line) => line.trim().length > 0)
  }, [
    currency,
    customerName,
    language,
    message,
    orderNumber,
    storeName,
    totalMinor,
  ])

  if (isEmpty || isError || (message && paragraphs.length === 0)) {
    return (
      <div className={cn('opacity-60 grayscale', className)}>
        <WhatsAppPhoneFrame>
          <WhatsAppChatHeader
            name={t('senderName')}
            statusLabel={t('senderStatus')}
            avatarAlt={t('avatarAlt')}
          />
          <div className="flex min-h-96 items-center justify-center px-6">
            <p
              className="text-ink-muted text-sm"
              role={isError ? 'alert' : undefined}
            >
              {isError ? t('previewError') : tUnavailable('previewEmpty')}
            </p>
          </div>
        </WhatsAppPhoneFrame>
      </div>
    )
  }

  if (!message) {
    return (
      <div className={className} aria-hidden="true">
        <WhatsAppPhoneFrame>
          <Skeleton className="min-h-[34rem] rounded-none" />
        </WhatsAppPhoneFrame>
      </div>
    )
  }

  return (
    <div className={className}>
      <WhatsAppPhonePreview
        senderName={t('senderName')}
        senderStatus={t('senderStatus')}
        avatarAlt={t('avatarAlt')}
        dayLabel={t('today')}
        paragraphs={paragraphs}
        timeLabel={timeLabel}
        buttons={message.buttons.map((label, index) => ({
          label,
          tone: templateReplyTone(index),
        }))}
        emphasizedTone={emphasizeConfirm ? 'confirm' : undefined}
        messageDir={message.direction}
      />
    </div>
  )
}
