'use client'

import { useTranslations } from 'next-intl'
import { formatTemplatePreviewTimestamp } from '@/features/settings/skins/shared/templatePreview'
import { WhatsAppPhonePreview } from '@/shared/ui/whatsapp'

interface TemplatePhonePreviewProps {
  language: 'ar' | 'en'
  paragraphs: ReadonlyArray<string>
  confirmButton: string
  cancelButton: string
}

/**
 * The template settings preview, shared by the embedded and standalone skins:
 * the same phone the onboarding test step shows the customer message in.
 */
export function TemplatePhonePreview({
  language,
  paragraphs,
  confirmButton,
  cancelButton,
}: TemplatePhonePreviewProps) {
  const t = useTranslations('onboarding.test.phone')

  return (
    <div className="flex justify-center">
      <WhatsAppPhonePreview
        senderName={t('senderName')}
        senderStatus={t('senderStatus')}
        avatarAlt={t('avatarAlt')}
        dayLabel={t('today')}
        paragraphs={paragraphs}
        timeLabel={formatTemplatePreviewTimestamp(language)}
        buttons={[
          { label: confirmButton, tone: 'confirm' },
          { label: cancelButton, tone: 'cancel' },
        ]}
        messageDir={language === 'ar' ? 'rtl' : 'ltr'}
      />
    </div>
  )
}
