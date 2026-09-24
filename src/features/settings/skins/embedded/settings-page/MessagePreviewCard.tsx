'use client'

import { Fragment } from 'react'
import {
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { MessageTemplatePreview } from '@/features/settings/api/settingsApi'
import {
  buildPreviewLines,
  isLtrVariable,
  PREVIEW_CUSTOMER_NAMES,
  PREVIEW_ORDER_NUMBER,
  PREVIEW_TOTAL_AMOUNT,
} from '@/features/settings/domain/messagePreview'
import { formatTemplatePreviewTimestamp } from '@/features/settings/skins/shared/templatePreview'
import { formatPlanPrice } from '@/shared/lib/money'
import { SegmentedButtons } from './SegmentedButtons'

interface MessagePreviewCardProps {
  language: 'ar' | 'en'
  onLanguageChange: (language: 'ar' | 'en') => void
  template: MessageTemplatePreview
  storeName: string
  currency: string
  testSendPhone: string | null
  testSendLanguage: 'ar' | 'en'
  canSendTest: boolean
  isDirty: boolean
  isSendingTest: boolean
  onSendTest: () => void
}

export function MessagePreviewCard({
  language,
  onLanguageChange,
  template,
  storeName,
  currency,
  testSendPhone,
  testSendLanguage,
  canSendTest,
  isDirty,
  isSendingTest,
  onSendTest,
}: MessagePreviewCardProps) {
  const t = useTranslations('settings.embedded.message')
  const lines = buildPreviewLines(template, {
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
            dir={language === 'ar' ? 'rtl' : 'ltr'}
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
              {[template.confirmButton, template.cancelButton].map((label) => (
                <Fragment key={label}>
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

        {canSendTest && (
          <BlockStack gap="100">
            <Button
              fullWidth
              loading={isSendingTest}
              disabled={isDirty}
              onClick={onSendTest}
            >
              {t('testSend')}
            </Button>
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
          </BlockStack>
        )}

        <Text as="p" variant="bodySm" tone="subdued">
          {t('templatesNote')}
        </Text>
      </BlockStack>
    </Card>
  )
}
