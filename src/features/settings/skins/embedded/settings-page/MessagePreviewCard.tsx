'use client'

import { useId } from 'react'
import {
  BlockStack,
  Box,
  Button,
  Card,
  Collapsible,
  InlineError,
  InlineStack,
  Select,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { TestPhonePrompt } from '@/features/settings/domain/useTestPhonePrompt'
import type { PreviewSample } from '@/features/settings/domain/messagePreview'
import { SettingsPhonePreview } from '@/features/settings/skins/shared/SettingsPhonePreview'
import type { MessageLanguage } from '@/shared/lib/messageLanguage'
import type { TemplateMessage } from '@/shared/lib/templateMessage'
import {
  InternationalPhoneInput,
  type E164Value,
} from '@/shared/ui/international-phone-input'

interface MessagePreviewCardProps {
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
  /** Sends the test, asking for the merchant's number first when needed. */
  phonePrompt: TestPhonePrompt
  /** The store's banner, when its messages carry it. */
  headerImage?: { src: string; alt: string }
}

export function MessagePreviewCard({
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
  phonePrompt,
  headerImage,
}: MessagePreviewCardProps) {
  const t = useTranslations('settings.embedded.message')
  const promptId = useId()
  const fieldId = useId()
  const noteId = useId()
  // The test sends the saved settings, so the prompt waits for a clean form.
  const isPromptOpen = phonePrompt.isOpen && !isDirty
  const languageName = t(`languageNames.${language}`)
  const testLanguageName = t(`languageNames.${testSendLanguage}`)

  return (
    <Card>
      <BlockStack gap="300">
        <BlockStack gap="050">
          <Text as="h2" variant="headingMd">
            {t('previewHeading')}
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            {previewingLabel}
          </Text>
        </BlockStack>
        {languageChoice && (
          <Select
            label={t('previewLanguageGroup')}
            labelInline
            value={language}
            onChange={(value) =>
              languageChoice.onChange(value as MessageLanguage)
            }
            options={languageChoice.languages.map((option) => ({
              value: option,
              label: t(`languageNames.${option}`),
            }))}
          />
        )}

        <SettingsPhonePreview
          language={language}
          message={message}
          sample={sample}
          label={t('previewAria', { language: languageName })}
          emptyLabel={t('previewEmpty')}
          headerImage={headerImage}
        />
        {note && (
          <Text as="p" variant="bodySm" tone="subdued">
            {note}
          </Text>
        )}

        {canSendTest && (
          <BlockStack gap="100">
            <Button
              fullWidth
              variant="primary"
              loading={isSendingTest}
              disabled={isDirty || !isPreviewLive}
              onClick={() => void phonePrompt.requestSend()}
            >
              {t('testSend')}
            </Button>
            <InlineStack gap="200" blockAlign="baseline">
              <Text as="p" variant="bodySm" tone="subdued">
                {isDirty
                  ? t('testSendSaveFirst')
                  : !isPreviewLive
                    ? t('testSendLanguageLocked', {
                        language: testLanguageName,
                      })
                    : testSendPhone
                      ? t.rich('testSendHelp', {
                          phone: () => <bdi dir="ltr">{testSendPhone}</bdi>,
                          language: testLanguageName,
                        })
                      : t('testSendHelpNoPhone', {
                          language: testLanguageName,
                        })}
              </Text>
              {!isDirty && isPreviewLive && testSendPhone && !isPromptOpen && (
                <Button
                  variant="plain"
                  disabled={isSendingTest}
                  onClick={phonePrompt.openToChange}
                >
                  {t('testPhone.change')}
                </Button>
              )}
            </InlineStack>
            <Collapsible id={promptId} open={isPromptOpen}>
              {/* Mounted per opening, so the country follows the number. */}
              {isPromptOpen && (
                <Box paddingBlockStart="300">
                  <BlockStack gap="300">
                    <BlockStack gap="100">
                      <InternationalPhoneInput
                        label={t('testPhone.label')}
                        value={
                          (phonePrompt.phone || undefined) as
                            | E164Value
                            | undefined
                        }
                        defaultCountry={phonePrompt.defaultCountry}
                        onChange={(value) => phonePrompt.setPhone(value ?? '')}
                        disabled={phonePrompt.isSubmitting}
                        aria-invalid={
                          phonePrompt.error === 'invalid' ? true : undefined
                        }
                        aria-describedby={
                          phonePrompt.error
                            ? `${noteId} ${fieldId}Error`
                            : noteId
                        }
                        validateWhileTyping={false}
                      />
                      <span id={noteId}>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {phonePrompt.isSuggested
                            ? t('testPhone.suggested')
                            : t('testPhone.description')}
                        </Text>
                      </span>
                      {phonePrompt.error && (
                        <InlineError
                          message={t(`testPhone.${phonePrompt.error}`)}
                          fieldID={fieldId}
                        />
                      )}
                    </BlockStack>
                    <InlineStack gap="200">
                      <Button
                        variant="primary"
                        loading={phonePrompt.isSubmitting}
                        onClick={() => void phonePrompt.submit()}
                      >
                        {t('testPhone.submit')}
                      </Button>
                      <Button
                        disabled={phonePrompt.isSubmitting}
                        onClick={phonePrompt.close}
                      >
                        {t('testPhone.cancel')}
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Box>
              )}
            </Collapsible>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  )
}
