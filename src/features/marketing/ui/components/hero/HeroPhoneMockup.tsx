'use client'

import { useTranslations } from 'next-intl'
import {
  HERO_MOCKUP_TEMPLATES,
  type MockupSegment,
} from '@/features/marketing/config/heroMockup'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  formatMessageTotal,
  getMessageLanguageDirection,
  getMessagePreviewTimestamp,
  isMessageLanguage,
  MESSAGE_SAMPLE_CUSTOMER_NAMES,
} from '@/shared/lib/messageLanguage'
import { cn } from '@/shared/lib/utils'
import { WhatsAppPhonePreview } from '@/shared/ui/whatsapp'

// Synthetic order shown in the mockup; never a real customer's data.
const DEMO_ORDER = { number: '1042', amount: '599', currency: 'EGP' }

interface HeroPhoneMockupProps {
  className?: string
}

/**
 * The registered confirmation template of the page's language, filled with a
 * demo order, as the customer sees it in WhatsApp.
 */
export function HeroPhoneMockup({ className }: HeroPhoneMockupProps) {
  const t = useTranslations('hero')
  const tPhone = useTranslations('onboarding.test.phone')
  const { locale } = useLocaleInfo()
  const language = isMessageLanguage(locale) ? locale : 'en'
  const template = HERO_MOCKUP_TEMPLATES[language]

  const values = {
    customer: MESSAGE_SAMPLE_CUSTOMER_NAMES[language],
    store: template.store,
    order: DEMO_ORDER.number,
    total: formatMessageTotal(DEMO_ORDER.amount, DEMO_ORDER.currency, language),
  }

  const renderSegment = (segment: MockupSegment, index: number) => {
    if (typeof segment === 'string') return segment
    const text = values[segment.variable]
    // The order number is the one value an RTL line can reorder.
    const node =
      segment.variable === 'order' ? <bdi dir="ltr">{text}</bdi> : text
    return segment.bold ? (
      <b key={index} className="font-bold">
        {node}
      </b>
    ) : (
      <span key={index}>{node}</span>
    )
  }

  return (
    <div
      role="img"
      aria-label={t('mockup_label')}
      className={cn('w-full', className)}
    >
      <WhatsAppPhonePreview
        compact
        senderName={tPhone('senderName')}
        senderStatus={tPhone('senderStatus')}
        avatarAlt=""
        dayLabel={tPhone('today')}
        paragraphs={template.lines.map((line, index) => (
          <span key={index}>{line.map(renderSegment)}</span>
        ))}
        timeLabel={getMessagePreviewTimestamp(language)}
        buttons={[
          { label: template.confirm, tone: 'confirm' },
          { label: template.cancel, tone: 'cancel' },
        ]}
        messageDir={getMessageLanguageDirection(language)}
        messageLang={language}
      />
    </div>
  )
}
