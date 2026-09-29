'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { OnboardingTestTemplatePreview } from '@/features/onboarding/domain/onboarding.types'
import { cn } from '@/shared/lib/utils'
import { formatMoneyParts } from '@/shared/lib/money'
import { fillTemplatePreview } from '@/shared/lib/templatePreview'
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
  /** The template text; null while it loads. */
  template: OnboardingTestTemplatePreview | null
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
  template,
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
    if (!template) return []
    const { amount, currency: symbol } = formatMoneyParts(
      totalMinor,
      currency,
      language
    )
    return fillTemplatePreview(template, {
      customer: customerName,
      store: storeName.trim() || '…',
      // Isolated so "#TEST-1" and "250.00 ج.م" keep their order inside
      // the other script, and the order number never wraps at its hyphen.
      order: `\u2068#${orderNumber.replace(/-/g, '\u2011')}\u2069`,
      total: `\u2068${amount} ${symbol.replace(/\.$/, '')}\u2069`,
    })
  }, [
    currency,
    customerName,
    language,
    orderNumber,
    storeName,
    template,
    totalMinor,
  ])

  if (isEmpty) {
    return (
      <div className={cn('opacity-60 grayscale', className)}>
        <WhatsAppPhoneFrame>
          <WhatsAppChatHeader
            name={t('senderName')}
            statusLabel={t('senderStatus')}
            avatarAlt={t('avatarAlt')}
          />
          <div className="flex min-h-96 items-center justify-center px-6">
            <p className="text-ink-muted text-sm">
              {tUnavailable('previewEmpty')}
            </p>
          </div>
        </WhatsAppPhoneFrame>
      </div>
    )
  }

  if (!template) {
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
        buttons={[
          { label: template.confirmButton, tone: 'confirm' },
          { label: template.cancelButton, tone: 'cancel' },
        ]}
        emphasizedTone={emphasizeConfirm ? 'confirm' : undefined}
        messageDir={language === 'ar' ? 'rtl' : 'ltr'}
      />
    </div>
  )
}
