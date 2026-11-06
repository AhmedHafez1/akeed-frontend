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
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { CheckIcon, InfoIcon, XSmallIcon } from '@shopify/polaris-icons'
import { useLocale, useTranslations } from 'next-intl'
import { getLocaleDirection } from '@/shared/lib/locale'
import {
  thankYouPreview,
  type ThankYouMessagesProps,
} from '@/features/settings/domain/thankYouPreview'

export function ThankYouMessagesCard(props: ThankYouMessagesProps) {
  const t = useTranslations('settings.thankYou')
  const tLanguages = useTranslations('settings.embedded.message.languageNames')
  const locale = useLocale()
  const id = useId()
  const preview = thankYouPreview(props)
  if (!props.acknowledgment) return null
  return (
    <Card padding="600">
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center" gap="300">
          <Text as="h2" variant="headingMd">
            {t('heading')}
          </Text>
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
            ariaDescribedBy={`${id}-description ${id}-cost${!props.acknowledgment.available ? ` ${id}-unavailable` : ''}`}
          />
          <Text as="p" id={`${id}-description`} variant="bodySm" tone="subdued">
            {t('description')}
          </Text>
        </BlockStack>
        <Box
          background="bg-surface-secondary"
          borderColor="border"
          borderWidth="025"
          borderRadius="200"
          padding="300"
        >
          <InlineGrid columns="20px 1fr" gap="200" alignItems="start">
            <Icon source={InfoIcon} tone="subdued" />
            <Text as="p" id={`${id}-cost`} variant="bodySm">
              {t('planCost')}
            </Text>
          </InlineGrid>
        </Box>
        {!props.acknowledgment.available && (
          <div id={`${id}-unavailable`} role="status">
            <Banner tone="warning">{t('unavailable')}</Banner>
          </div>
        )}
        <Divider />
        <BlockStack gap="200">
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
        </BlockStack>
        <BlockStack gap="400">
          {(['confirmed', 'canceled'] as const).map((outcome) => (
            <BlockStack gap="200" key={outcome}>
              <InlineStack gap="200" blockAlign="center">
                <Box
                  background={
                    outcome === 'confirmed'
                      ? 'bg-fill-success-secondary'
                      : 'bg-fill-secondary'
                  }
                  borderRadius="full"
                >
                  <Icon
                    source={outcome === 'confirmed' ? CheckIcon : XSmallIcon}
                    tone={outcome === 'confirmed' ? 'success' : 'subdued'}
                  />
                </Box>
                <Text as="h4" variant="headingSm">
                  {t(outcome)}
                </Text>
              </InlineStack>
              <Box
                background="bg-surface-secondary"
                borderColor="border"
                borderWidth="025"
                borderRadius="200"
                padding="400"
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
      </BlockStack>
    </Card>
  )
}
