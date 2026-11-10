'use client'

import {
  Badge,
  BlockStack,
  Card,
  Checkbox,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { ClockIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { SettingsHelp } from './SettingsHelp'

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
  variants,
}: {
  checked: boolean
  ready: boolean
  onChange: (checked: boolean) => void
  readOnly: boolean
  variants?: {
    ready: boolean
    reason: string | null
    branding_supported?: boolean
  }[]
}) {
  const t = useTranslations('settings.changeRequests')
  const blocked = !ready && !checked
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center" gap="300">
          <InlineStack gap="100" blockAlign="center">
            <Text as="h2" variant="headingMd">
              {t('heading')}
            </Text>
            <SettingsHelp label={t('heading')} content={t('noteAckPlan')} />
          </InlineStack>
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
          {!ready && (
            <InlineGrid columns="20px 1fr" gap="100" alignItems="center">
              <Icon source={ClockIcon} tone="caution" />
              <Text as="p" variant="bodySm" tone="caution">
                {variants?.some(
                  (v) =>
                    v.reason === 'change_image_twin_unavailable' ||
                    v.reason === 'logo_banner_unavailable'
                )
                  ? t('brandingUnavailable')
                  : t('notAvailableYet')}
              </Text>
            </InlineGrid>
          )}
        </BlockStack>
        {variants?.some((v) => v.branding_supported === false) && (
          <Text as="p" variant="bodySm" tone="subdued">
            {t('ownNumberText')}
          </Text>
        )}
      </BlockStack>
    </Card>
  )
}
