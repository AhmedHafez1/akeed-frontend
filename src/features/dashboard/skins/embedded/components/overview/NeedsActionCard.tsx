import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  Icon,
  InlineStack,
  Link,
  Text,
} from '@shopify/polaris'
import { CheckCircleIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { hasCapability } from '../../../../domain/verificationLifecycle'
import type { ManualConfirmationTarget } from '../../../../domain/useManualConfirmation'
import { useNeedsActionReason } from '../../../../domain/useNeedsActionReason'
import {
  customerDisplayName,
  formatCount,
  formatOrderAmount,
  formatOrderNumber,
  formatPhoneInternational,
  whatsAppChatUrl,
} from '../../../../lib/orderDisplay'
import type {
  DashboardOverview,
  NeedsActionItem,
} from '../../../../model/dashboard.model'
import { OrderNumberLink } from '../shared/OrderNumberLink'

function ReasonLine({
  item,
  timeZone,
}: {
  item: NeedsActionItem
  timeZone: string
}) {
  const { text, isCritical } = useNeedsActionReason(item.reason, timeZone)
  return (
    <Text as="p" variant="bodySm" tone={isCritical ? 'critical' : 'subdued'}>
      {text}
    </Text>
  )
}

function NeedsActionRow({
  item,
  timeZone,
  canConfirm,
  onRequestConfirm,
}: {
  item: NeedsActionItem
  timeZone: string
  canConfirm: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
}) {
  const t = useTranslations('dashboard.overview.needsAction.actions')
  const tTable = useTranslations('dashboard.table')
  const { locale } = useLocaleInfo()
  const name = customerDisplayName(item.customer_name)
  const phone = formatPhoneInternational(item.customer_phone)
  const orderLabel =
    formatOrderNumber(item.order_number) ??
    `${tTable('orderFallbackPrefix')} ${item.order_id.slice(0, 8)}`
  const chatUrl =
    item.reason.type === 'delivery_failed'
      ? null
      : whatsAppChatUrl(item.customer_phone)
  const confirmable =
    canConfirm &&
    hasCapability(item.capabilities, 'merchant_manual_confirmation')

  return (
    <li>
      <Box padding="400">
        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[6rem_minmax(0,1fr)_auto_auto] md:gap-6">
          <OrderNumberLink
            orderNumber={item.order_number}
            platform={item.platform}
            externalOrderId={item.external_order_id}
            fallback={orderLabel}
          />
          <BlockStack gap="050">
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {name ?? <bdi dir="ltr">{phone}</bdi>}
            </Text>
            <ReasonLine item={item} timeZone={timeZone} />
          </BlockStack>
          <Text as="p" variant="bodyLg" fontWeight="semibold">
            <bdi dir="ltr">
              {formatOrderAmount(item.total_price, item.currency, locale)}
            </bdi>
          </Text>
          <InlineStack gap="200" wrap={false}>
            {chatUrl && (
              <Button
                url={chatUrl}
                target="_blank"
                accessibilityLabel={t('whatsappLabel', {
                  customer: name ?? phone,
                })}
              >
                {t('whatsapp')}
              </Button>
            )}
            {confirmable && (
              <Button
                accessibilityLabel={t('manualConfirmLabel', {
                  order: orderLabel,
                })}
                onClick={() =>
                  onRequestConfirm({
                    verificationId: item.verification_id,
                    orderLabel,
                  })
                }
              >
                {t('manualConfirm')}
              </Button>
            )}
          </InlineStack>
        </div>
      </Box>
    </li>
  )
}

/**
 * The orders waiting on the merchant, highest value first (at most five), with
 * the one or two things they can do about each.
 */
export function NeedsActionCard({
  needsAction,
  timeZone,
  canConfirm,
  onRequestConfirm,
  onViewAll,
}: {
  needsAction: DashboardOverview['needs_action']
  timeZone: string
  canConfirm: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onViewAll: () => void
}) {
  const t = useTranslations('dashboard.overview.needsAction')
  const { locale } = useLocaleInfo()

  return (
    <Card padding="0">
      <Box padding="400">
        <InlineStack align="space-between" blockAlign="center" gap="300">
          <InlineStack gap="200" blockAlign="center">
            <Text as="h2" variant="headingLg">
              {t('title')}
            </Text>
            {needsAction.count > 0 && (
              <Badge tone="attention">
                {formatCount(needsAction.count, locale)}
              </Badge>
            )}
            <span className="sr-only">
              {t('countLabel', { count: needsAction.count })}
            </span>
          </InlineStack>
          <Link onClick={onViewAll}>{t('allOrders')}</Link>
        </InlineStack>
      </Box>
      <Divider />
      {needsAction.items.length === 0 ? (
        <Box padding="600">
          <BlockStack gap="200" inlineAlign="center">
            <span aria-hidden="true">
              <Icon source={CheckCircleIcon} tone="success" />
            </span>
            <Text as="p" variant="headingMd" alignment="center">
              {t('empty')}
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
              {t('emptyBody')}
            </Text>
          </BlockStack>
        </Box>
      ) : (
        <ul className="m-0 list-none divide-y divide-[var(--p-color-border-secondary)] p-0">
          {needsAction.items.map((item) => (
            <NeedsActionRow
              key={item.verification_id}
              item={item}
              timeZone={timeZone}
              canConfirm={canConfirm}
              onRequestConfirm={onRequestConfirm}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}
