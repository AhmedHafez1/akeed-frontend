'use client'

import { useId } from 'react'
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Card,
  Checkbox,
  Divider,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { useLocale, useTranslations } from 'next-intl'
import { getLocaleDirection } from '@/shared/lib/locale'
import {
  thankYouPreview,
  type ThankYouMessagesProps,
} from '@/features/settings/domain/thankYouPreview'
import { SettingsHelp } from './SettingsHelp'

export function ThankYouMessagesCard(props: ThankYouMessagesProps) {
  const t = useTranslations('settings.thankYou')
  const tLanguages = useTranslations('settings.embedded.message.languageNames')
  const locale = useLocale()
  const id = useId()
  const preview = thankYouPreview(props)
  if (!props.acknowledgment) return null
  const details = (
    <BlockStack gap="300">
      <Text as="p">{t('planCost')}</Text>
      <Divider />
      <InlineStack align="space-between" blockAlign="baseline" gap="200">
        <Text as="h3" variant="headingSm">
          {t('examplesHeading')}
        </Text>
        <Text as="span" variant="bodySm" tone="subdued">
          {tLanguages(props.language)}
        </Text>
      </InlineStack>
      {props.automaticStyle && (
        <Text as="p" variant="bodySm" tone="subdued">
          {t('autoNote')}
        </Text>
      )}
      {(['confirmed', 'canceled'] as const).map((outcome) => (
        <BlockStack gap="200" key={outcome}>
          <Text as="h4" variant="headingSm">
            {t(outcome)}
          </Text>
          <Box
            background="bg-surface-secondary"
            borderColor="border"
            borderWidth="025"
            borderRadius="200"
            padding="300"
          >
            <p
              dir={
                preview[outcome]
                  ? preview.direction
                  : getLocaleDirection(locale)
              }
              lang={preview[outcome] ? props.language : locale}
              style={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                textAlign: 'start',
                margin: 0,
              }}
            >
              {preview[outcome] ?? t('textUnavailable')}
            </p>
          </Box>
        </BlockStack>
      ))}
    </BlockStack>
  )
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center" gap="300">
          <InlineStack gap="100" blockAlign="center">
            <Text as="h2" variant="headingMd">
              {t('heading')}
            </Text>
            <SettingsHelp label={t('heading')} content={details} rich />
          </InlineStack>
          <Badge tone={props.checked ? 'success' : undefined}>
            {t(props.checked ? 'on' : 'off')}
          </Badge>
        </InlineStack>
        <BlockStack gap="200">
          <Checkbox
            label={t('label')}
            checked={props.checked}
            onChange={props.onChange}
            disabled={
              props.readOnly ||
              (!props.acknowledgment.available && !props.checked)
            }
            ariaDescribedBy={`${id}-description${!props.acknowledgment.available ? ` ${id}-unavailable` : ''}`}
          />
          <Text as="p" id={`${id}-description`} variant="bodySm" tone="subdued">
            {t('description')}
          </Text>
        </BlockStack>
        {!props.acknowledgment.available && (
          <div id={`${id}-unavailable`} role="status">
            <Banner tone="warning">{t('unavailable')}</Banner>
          </div>
        )}
      </BlockStack>
    </Card>
  )
}
