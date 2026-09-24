import { Badge, BlockStack, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  resolveRowStatus,
  type RowStatusTone,
} from '../../../../domain/confirmationRowStatus'
import {
  customerDisplayName,
  formatClockTime,
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

const BADGE_TONES: Record<
  RowStatusTone,
  'success' | 'critical' | 'attention' | undefined
> = {
  success: 'success',
  critical: 'critical',
  warning: 'attention',
  neutral: undefined,
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
  const { locale } = useLocaleInfo()
  const view = resolveRowStatus(row)
  const sub = view.sub
    ? t(view.sub, {
        time: view.subTime
          ? formatClockTime(view.subTime, locale, timeZone)
          : '',
      })
    : null

  return (
    <BlockStack gap="100" inlineAlign="start">
      <Badge tone={BADGE_TONES[view.tone]}>{t(view.badge)}</Badge>
      {sub && (
        <Text
          as="span"
          variant="bodySm"
          tone={
            view.tone === 'critical' && row.status === 'failed'
              ? 'critical'
              : 'subdued'
          }
        >
          {sub}
        </Text>
      )}
    </BlockStack>
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
