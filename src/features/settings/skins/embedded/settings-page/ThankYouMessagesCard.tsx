'use client'

import { BlockStack, Card, Checkbox, InlineGrid, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import {
  thankYouPreview,
  type ThankYouMessagesProps,
} from '@/features/settings/domain/thankYouPreview'

export function ThankYouMessagesCard(props: ThankYouMessagesProps) {
  const t = useTranslations('settings.thankYou')
  const preview = thankYouPreview(props)
  if (!props.acknowledgment) return null
  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          {t('heading')}
        </Text>
        <Checkbox
          label={t('label')}
          checked={props.checked}
          onChange={props.onChange}
          disabled={
            props.readOnly ||
            (!props.acknowledgment.available && !props.checked)
          }
          helpText={t('description')}
        />
        <Text as="p" fontWeight="semibold">
          {t('planCost')}
        </Text>
        {!props.acknowledgment.available && (
          <Text as="p" tone="subdued">
            {t('unavailable')}
          </Text>
        )}
        <InlineGrid columns={{ xs: 1, sm: 2 }} gap="300">
          {(['confirmed', 'canceled'] as const).map((outcome) => (
            <BlockStack gap="100" key={outcome}>
              <Text as="h3" variant="headingSm">
                {t(outcome)}
              </Text>
              <p
                dir={preview.direction}
                lang={props.language}
                style={{ whiteSpace: 'pre-wrap', margin: 0 }}
              >
                {preview[outcome] ?? t('textUnavailable')}
              </p>
            </BlockStack>
          ))}
        </InlineGrid>
        <Text as="p" tone="subdued">
          {t('previewNote')}
        </Text>
        {props.automaticStyle && (
          <Text as="p" tone="subdued">
            {t('autoNote')}
          </Text>
        )}
      </BlockStack>
    </Card>
  )
}
