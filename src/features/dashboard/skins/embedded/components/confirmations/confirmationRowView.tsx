import { Badge, BlockStack, InlineStack, Icon, Text } from '@shopify/polaris'
import { NotificationIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  resolveRowStatus,
  type RowStatusKind,
} from '../../../../domain/confirmationRowStatus'
import { formatTooltipDateTime } from '../../../../domain/verificationRow'
import { useStatusTooltip } from '../../../../domain/useStatusTooltip'
import {
  customerDisplayName,
  formatDayAndClock,
  formatOrderAmount,
  formatOrderNumber,
  formatPhoneInternational,
} from '../../../../lib/orderDisplay'
import type { VerificationItem } from '../../../../model/dashboard.model'
import type { ConfirmationRowActionHandlers } from './ConfirmationRowActions'

/** What the table and the card list both take. */
export interface ConfirmationsListProps {
  rows: VerificationItem[]
  timeZone: string
  canWrite: boolean
  canRetry: boolean
  actingId: string | null
  handlers: ConfirmationRowActionHandlers
  pagination: {
    label: string
    hasNext: boolean
    hasPrevious: boolean
    onNext: () => void
    onPrevious: () => void
    previousLabel: string
    nextLabel: string
  }
}

/**
 * Each status kind wears the same colour family as the standalone
 * `StatusBadge` (words only in both), so the two modes read alike.
 */
export const BADGE_TONES: Record<
  RowStatusKind,
  'info' | 'warning' | 'success' | 'critical' | undefined
> = {
  pending: 'info',
  needsAction: 'warning',
  confirmed: 'success',
  canceled: 'critical',
  failed: 'critical',
  scheduled: undefined,
}

/** The row's display values, derived once for the table and the cards. */
export function useConfirmationRowView(row: VerificationItem) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  return {
    name: customerDisplayName(row.customer_name),
    phone: formatPhoneInternational(row.customer_phone),
    orderLabel:
      formatOrderNumber(row.order_number) ??
      `${t('table.orderFallbackPrefix')} ${row.order_id.slice(0, 8)}`,
    amount: formatOrderAmount(row.total_price, row.currency, locale),
    isCanceled: row.status === 'canceled',
  }
}

export function StatusCell({
  row,
  timeZone,
}: {
  row: VerificationItem
  timeZone: string
}) {
  const t = useTranslations('dashboard.confirmations.status')
  const view = resolveRowStatus(row, { showStoreCancellation: true })
  const statusTitle = useStatusTooltip(row, timeZone)
  return (
    <BlockStack gap="100" inlineAlign="start">
      <span title={statusTitle}>
        <Badge tone={BADGE_TONES[view.kind]}>{t(view.badge)}</Badge>
      </span>
    </BlockStack>
  )
}

export function FollowUpCell({
  row,
  timeZone,
  showTime = false,
}: {
  row: VerificationItem
  timeZone: string
  showTime?: boolean
}) {
  const t = useTranslations('dashboard.table.followUp')
  const { locale } = useLocaleInfo()
  if (!row.follow_up_sent_at) return null

  const sentAt = formatDayAndClock(row.follow_up_sent_at, locale, timeZone)
  const sentAtTitle = formatTooltipDateTime(
    row.follow_up_sent_at,
    locale,
    timeZone
  )
  // On a card a lone "Sent" says nothing; spell out what went out and when.
  if (showTime) {
    return (
      <span title={sentAtTitle || undefined}>
        <InlineStack gap="100" blockAlign="center" wrap={false}>
          <span>
            <Icon source={NotificationIcon} tone="subdued" />
          </span>
          <Text as="span" variant="bodySm" tone="subdued">
            {t('sentAt', { time: sentAt })}
          </Text>
        </InlineStack>
      </span>
    )
  }
  return (
    <span title={sentAtTitle || undefined}>
      <Badge tone="success">{t('sent')}</Badge>
    </span>
  )
}

/** The name, or the phone standing in for it with "بدون اسم" below. */
export function CustomerCell({
  name,
  phone,
}: {
  name: string | null
  phone: string
}) {
  const t = useTranslations('dashboard')
  const phoneText = <bdi dir="ltr">{phone || t('table.noPhone')}</bdi>
  return (
    <BlockStack gap="050">
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        {name ?? phoneText}
      </Text>
      <Text as="span" variant="bodySm" tone="subdued">
        {name ? phoneText : t('confirmations.noName')}
      </Text>
    </BlockStack>
  )
}

export function CustomerNameCell({ name }: { name: string | null }) {
  const t = useTranslations('dashboard')
  return (
    <Text as="span" variant="bodyMd" tone="subdued">
      {name ? <bdi>{name}</bdi> : t('confirmations.noName')}
    </Text>
  )
}

export function PhoneCell({ phone }: { phone: string }) {
  const t = useTranslations('dashboard')
  return (
    <Text as="span" variant="bodySm" fontWeight="semibold" truncate>
      <bdi dir="ltr">{phone || t('table.noPhone')}</bdi>
    </Text>
  )
}

export function AmountText({
  amount,
  isCanceled,
}: {
  amount: string
  isCanceled: boolean
}) {
  return (
    <Text
      as="span"
      variant="bodyMd"
      fontWeight="semibold"
      tone={isCanceled ? 'subdued' : undefined}
      textDecorationLine={isCanceled ? 'line-through' : undefined}
    >
      <bdi dir="ltr">{amount}</bdi>
    </Text>
  )
}
