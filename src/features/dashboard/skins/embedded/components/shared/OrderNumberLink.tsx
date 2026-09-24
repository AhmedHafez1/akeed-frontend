import { Link, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import {
  formatOrderNumber,
  shopifyOrderAdminUrl,
} from '../../../../lib/orderDisplay'

/**
 * `#1138`, linked to the order in Shopify admin when the row has one.
 * `target="_top"` lets App Bridge leave the iframe for the admin page.
 */
export function OrderNumberLink({
  orderNumber,
  platform,
  externalOrderId,
  fallback,
}: {
  orderNumber: string | null
  platform: string | null | undefined
  externalOrderId: string | null | undefined
  fallback: string
}) {
  const t = useTranslations('dashboard.confirmations')
  const label = formatOrderNumber(orderNumber) ?? fallback
  const url = shopifyOrderAdminUrl(platform, externalOrderId)

  const text = (
    <bdi dir="ltr" className="font-semibold">
      {label}
    </bdi>
  )
  if (!url) {
    return (
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        {text}
      </Text>
    )
  }
  return (
    <Link
      url={url}
      target="_top"
      accessibilityLabel={t('openOrderLabel', { order: label })}
    >
      {text}
    </Link>
  )
}
