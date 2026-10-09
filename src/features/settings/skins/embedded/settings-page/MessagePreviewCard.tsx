'use client'

import { Fragment, useId } from 'react'
import {
  BlockStack,
  Box,
  Button,
  Card,
  Collapsible,
  Divider,
  InlineError,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { TestPhonePrompt } from '@/features/settings/domain/useTestPhonePrompt'
import {
  buildPreviewLines,
  isLtrVariable,
  PREVIEW_CUSTOMER_NAMES,
  PREVIEW_ORDER_NUMBER,
  PREVIEW_TOTAL_AMOUNT,
} from '@/features/settings/domain/messagePreview'
import { formatTemplatePreviewTimestamp } from '@/features/settings/skins/shared/templatePreview'
import { formatPlanPrice } from '@/shared/lib/money'
import type { TemplateMessage } from '@/shared/lib/templateMessage'
import {
  InternationalPhoneInput,
  type E164Value,
} from '@/shared/ui/international-phone-input'
import { SegmentedButtons } from './SegmentedButtons'

interface MessagePreviewCardProps {
  language: 'ar' | 'en'
  onLanguageChange: (language: 'ar' | 'en') => void
  message: TemplateMessage
  /** A note under the preview, for example how `auto` picks a style. */
  note?: string
  storeName: string
  currency: string
  testSendPhone: string | null
  testSendLanguage: 'ar' | 'en'
  canSendTest: boolean
  isDirty: boolean
  isSendingTest: boolean
  /** Sends the test, asking for the merchant's number first when needed. */
  phonePrompt: TestPhonePrompt
}

export function MessagePreviewCard({
  language,
  onLanguageChange,
  message,
  note,
  storeName,
  currency,
  testSendPhone,
  testSendLanguage,
  canSendTest,
  isDirty,
  isSendingTest,
  phonePrompt,
}: MessagePreviewCardProps) {
  const t = useTranslations('settings.embedded.message')
  const promptId = useId()
  const fieldId = useId()
  const noteId = useId()
  // The test sends the saved settings, so the prompt waits for a clean form.
  const isPromptOpen = phonePrompt.isOpen && !isDirty
  const lines = buildPreviewLines(message, {
    customer: PREVIEW_CUSTOMER_NAMES[language],
    store: storeName.trim() || 'Akeed Store',
    order: PREVIEW_ORDER_NUMBER,
    total: formatPlanPrice(PREVIEW_TOTAL_AMOUNT, currency),
  })
  const languageName = t(`languageNames.${language}`)
  const testLanguageName = t(`languageNames.${testSendLanguage}`)

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center" gap="200">
          <Text as="h2" variant="headingMd">
            {t('previewHeading')}
          </Text>
          <SegmentedButtons
            label={t('previewLanguageGroup')}
            value={language}
            onChange={onLanguageChange}
            options={[
              { value: 'ar', label: t('languageNames.ar') },
              { value: 'en', label: t('languageNames.en') },
            ]}
          />
        </InlineStack>

        <Box background="bg-surface-secondary" borderRadius="300" padding="400">
          <div
            role="img"
            aria-label={t('previewAria', { language: languageName })}
            dir={message.direction}
            lang={language}
          >
            <Box
              background="bg-surface"
              borderRadius="300"
              shadow="100"
              overflowX="hidden"
              overflowY="hidden"
            >
              <Box padding="400">
                <BlockStack gap="150">
                  {lines.length === 0 && (
                    <Text as="p" tone="subdued">
                      {t('previewEmpty')}
                    </Text>
                  )}
                  {lines.map((segments, index) => (
                    <Text as="p" key={index}>
                      {segments.map((segment, segmentIndex) =>
                        segment.kind === 'text' ? (
                          <Fragment key={segmentIndex}>{segment.text}</Fragment>
                        ) : (
                          <Text
                            as="span"
                            fontWeight="semibold"
                            key={segmentIndex}
                          >
                            {isLtrVariable(segment.variable) ? (
                              <bdi dir="ltr">{segment.text}</bdi>
                            ) : (
                              segment.text
                            )}
                          </Text>
                        )
                      )}
                    </Text>
                  ))}
                  <InlineStack align="end">
                    <Text as="span" variant="bodySm" tone="subdued">
                      {formatTemplatePreviewTimestamp(language)}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Box>
              {message.buttons.map((label, index) => (
                <Fragment key={`${index}-${label}`}>
                  <Divider />
                  <Box padding="300">
                    <Text
                      as="p"
                      alignment="center"
                      fontWeight="medium"
                      tone="success"
                    >
                      {label}
                    </Text>
                  </Box>
                </Fragment>
              ))}
            </Box>
          </div>
        </Box>
        {note && (
          <Text as="p" variant="bodySm" tone="subdued">
            {note}
          </Text>
        )}

        {canSendTest && (
          <BlockStack gap="100">
            <Button
              fullWidth
              loading={isSendingTest}
              disabled={isDirty}
              onClick={() => void phonePrompt.requestSend()}
            >
              {t('testSend')}
            </Button>
            <InlineStack gap="200" blockAlign="baseline">
              <Text as="p" variant="bodySm" tone="subdued">
                {isDirty
                  ? t('testSendSaveFirst')
                  : testSendPhone
                    ? t.rich('testSendHelp', {
                        phone: () => <bdi dir="ltr">{testSendPhone}</bdi>,
                        language: testLanguageName,
                      })
                    : t('testSendHelpNoPhone', { language: testLanguageName })}
              </Text>
              {!isDirty && testSendPhone && !isPromptOpen && (
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
