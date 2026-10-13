'use client'

import { useId } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PreviewSample } from '@/features/settings/domain/messagePreview'
import { SettingsPhonePreview } from '@/features/settings/skins/shared/SettingsPhonePreview'
import type { MessageLanguage } from '@/shared/lib/messageLanguage'
import { formatPhoneInternational } from '@/shared/lib/phone'
import type { TemplateMessage } from '@/shared/lib/templateMessage'
import { cn } from '@/shared/lib/utils'
import { AkSelect, akButton, akCard, akLink } from '@/shared/ui'

interface MessagePreviewPanelProps {
  language: MessageLanguage
  /**
   * Given while the preview can show any language (the store's language is
   * automatic): the languages, live or not, and what picking one does.
   */
  languageChoice?: {
    languages: readonly MessageLanguage[]
    onChange: (language: MessageLanguage) => void
  }
  message: TemplateMessage
  sample: PreviewSample
  /** Which language and style the phone shows. */
  previewingLabel: string
  /** A note under the preview, for example how `auto` picks a style. */
  note?: string
  testSendPhone: string | null
  /** The language the test goes out in: the one being previewed. */
  testSendLanguage: MessageLanguage
  /** False while that language has no approved message to send. */
  isPreviewLive: boolean
  canSendTest: boolean
  isDirty: boolean
  isSendingTest: boolean
  onSendTest: () => void
  onChangePhone: () => void
}

/**
 * The preview beside the Message settings: the message in any language,
 * and a free test send to the merchant's own WhatsApp. The test is the
 * message on the phone: the previewed language, with its saved style, so it
 * waits for unsaved changes to be saved first and for a language that has an
 * approved message.
 */
export function MessagePreviewPanel({
  language,
  languageChoice,
  message,
  sample,
  previewingLabel,
  note,
  testSendPhone,
  testSendLanguage,
  isPreviewLive,
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
  const languageId = useId()
  const languageName = tShared(`languageNames.${language}`)
  const testLanguageName = tShared(`languageNames.${testSendLanguage}`)
  const phone = formatPhoneInternational(testSendPhone)

  return (
    <aside
      aria-labelledby={headingId}
      className={cn(akCard, 'min-[1100px]:sticky min-[1100px]:top-20')}
    >
      <div className="space-y-3 px-4 pt-4 pb-3 sm:px-6">
        <div>
          <h2 id={headingId} className="text-ak-section text-ink">
            {tShared('previewHeading')}
          </h2>
          <p className="text-ak-caption text-ink-muted mt-0.5">
            {previewingLabel}
          </p>
        </div>
        {languageChoice && (
          <div className="flex items-center gap-3">
            <label
              htmlFor={languageId}
              className="text-ak-caption text-ink shrink-0 font-semibold"
            >
              {tShared('previewLanguageGroup')}
            </label>
            <AkSelect
              id={languageId}
              className="min-w-0 flex-1"
              value={language}
              onChange={(event) =>
                languageChoice.onChange(event.target.value as MessageLanguage)
              }
              options={languageChoice.languages.map((option) => ({
                value: option,
                label: tShared(`languageNames.${option}`),
              }))}
            />
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <SettingsPhonePreview
          language={language}
          message={message}
          sample={sample}
          label={tShared('previewAria', { language: languageName })}
          emptyLabel={tShared('previewEmpty')}
        />
        {note && <p className="text-ak-caption text-ink-muted mt-3">{note}</p>}
      </div>

      {canSendTest && (
        <div className="border-line space-y-2 border-t p-4">
          <button
            type="button"
            onClick={onSendTest}
            disabled={isDirty || !isPreviewLive || isSendingTest}
            aria-busy={isSendingTest}
            aria-describedby={captionId}
            className={cn(akButton({ variant: 'primary' }), 'w-full')}
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
                : !isPreviewLive
                  ? tShared('testSendLanguageLocked', {
                      language: testLanguageName,
                    })
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
            {!isDirty && isPreviewLive && phone && (
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
    </aside>
  )
}
