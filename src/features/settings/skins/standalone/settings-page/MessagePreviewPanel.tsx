'use client'

import { useId } from 'react'
import { Loader2, Send, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { MessageTemplatePreview } from '@/features/settings/api/settingsApi'
import type { PreviewSample } from '@/features/settings/domain/messagePreview'
import { formatPhoneInternational } from '@/shared/lib/phone'
import { cn } from '@/shared/lib/utils'
import { AkSegmented, akButton, akCard, akLink } from '@/shared/ui'
import { WhatsAppMessagePreview } from './WhatsAppMessagePreview'

interface MessagePreviewPanelProps {
  language: 'ar' | 'en'
  onLanguageChange: (language: 'ar' | 'en') => void
  template: MessageTemplatePreview
  sample: PreviewSample
  testSendPhone: string | null
  testSendLanguage: 'ar' | 'en'
  canSendTest: boolean
  isDirty: boolean
  isSendingTest: boolean
  onSendTest: () => void
  onChangePhone: () => void
}

/**
 * The preview beside the Message settings: the message in either language,
 * a free test send to the merchant's own WhatsApp, and why only the style
 * and language can change. A test sends the saved settings, so it waits for
 * unsaved changes to be saved first.
 */
export function MessagePreviewPanel({
  language,
  onLanguageChange,
  template,
  sample,
  testSendPhone,
  testSendLanguage,
  canSendTest,
  isDirty,
  isSendingTest,
  onSendTest,
  onChangePhone,
}: MessagePreviewPanelProps) {
  const t = useTranslations('settings.standalone.page.message')
  const tShared = useTranslations('settings.embedded.message')
  const headingId = useId()
  const captionId = useId()
  const languageName = tShared(`languageNames.${language}`)
  const testLanguageName = tShared(`languageNames.${testSendLanguage}`)
  const phone = formatPhoneInternational(testSendPhone)

  return (
    <aside
      aria-labelledby={headingId}
      className={cn(akCard, 'min-[1100px]:sticky min-[1100px]:top-20')}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <h2 id={headingId} className="text-ak-section text-ink">
          {tShared('previewHeading')}
        </h2>
        <AkSegmented
          size="sm"
          aria-label={tShared('previewLanguageGroup')}
          value={language}
          onValueChange={onLanguageChange}
          options={[
            { value: 'ar', label: tShared('languageNames.ar') },
            { value: 'en', label: tShared('languageNames.en') },
          ]}
        />
      </div>

      <div className="px-4 pb-4">
        <WhatsAppMessagePreview
          language={language}
          template={template}
          sample={sample}
          label={tShared('previewAria', { language: languageName })}
          businessAccountLabel={t('businessAccount')}
        />
      </div>

      {canSendTest && (
        <div className="border-line space-y-2 border-t p-4">
          <button
            type="button"
            onClick={onSendTest}
            disabled={isDirty || isSendingTest}
            aria-busy={isSendingTest}
            aria-describedby={captionId}
            className={cn(akButton({ variant: 'secondary' }), 'w-full')}
          >
            {isSendingTest ? (
              <Loader2
                aria-hidden="true"
                className="motion-safe:animate-spin"
              />
            ) : (
              <Send aria-hidden="true" className="rtl:-scale-x-100" />
            )}
            {t('testSend')}
          </button>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p id={captionId} className="text-ak-caption text-ink-muted">
              {isDirty
                ? t('testSendSaveFirst')
                : phone
                  ? tShared.rich('testSendHelp', {
                      phone: () => (
                        <bdi
                          dir="ltr"
                          className="text-ink font-semibold tabular-nums"
                        >
                          {phone}
                        </bdi>
                      ),
                      language: testLanguageName,
                    })
                  : tShared('testSendHelpNoPhone', {
                      language: testLanguageName,
                    })}
            </p>
            {!isDirty && phone && (
              <button
                type="button"
                onClick={onChangePhone}
                disabled={isSendingTest}
                className={cn(akLink, 'text-ak-caption')}
              >
                {tShared('testPhone.change')}
              </button>
            )}
          </div>
        </div>
      )}

      <p className="border-line bg-surface-sunken text-ak-caption text-ink-muted rounded-b-ak-card flex items-start gap-2 border-t px-4 py-3 sm:px-6">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{tShared('templatesNote')}</span>
      </p>
    </aside>
  )
}
