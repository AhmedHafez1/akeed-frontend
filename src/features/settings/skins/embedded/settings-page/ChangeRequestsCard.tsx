'use client'

import {
  Badge,
  BlockStack,
  Card,
  Checkbox,
  Divider,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { ClockIcon, InfoIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'

/**
 * "Request a change" in the embedded settings: a third button on future
 * confirmation messages, off by default. Shopify orders get a tag and a
 * warning, never a fulfillment hold.
 */
export function ChangeRequestsCard({
  checked,
  ready,
  onChange,
  readOnly,
}: {
  checked: boolean
  ready: boolean
  onChange: (checked: boolean) => void
  readOnly: boolean
}) {
  const t = useTranslations('settings.changeRequests')
  const blocked = !ready && !checked
  return (
    <Card padding="600">
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center" gap="300">
          <Text as="h2" variant="headingMd">
            {t('heading')}
          </Text>
          <Badge tone={checked ? 'success' : undefined}>
            {t(checked ? 'on' : 'off')}
          </Badge>
        </InlineStack>
        <BlockStack gap="200">
          <Checkbox
            label={t('label')}
            checked={checked}
            disabled={readOnly || blocked}
            onChange={onChange}
            helpText={t('description')}
          />
          {blocked && (
            <InlineGrid columns="20px 1fr" gap="100" alignItems="center">
              <Icon source={ClockIcon} tone="caution" />
              <Text as="p" variant="bodySm" tone="caution">
                {t('notAvailableYet')}
              </Text>
            </InlineGrid>
          )}
        </BlockStack>
        <Divider />
        <InlineGrid columns="20px 1fr" gap="200" alignItems="start">
          <Icon source={InfoIcon} tone="subdued" />
          <BlockStack gap="150">
            <Text as="p" variant="bodySm" tone="subdued">
              {t('noteAckPlan')}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {t('noteShopify')}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {t('noteOff')}
            </Text>
          </BlockStack>
        </InlineGrid>
      </BlockStack>
    </Card>
  )
}
