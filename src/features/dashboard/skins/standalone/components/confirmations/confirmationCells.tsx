'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Badge, type BadgeProps } from '@/shared/ui'
import {
  resolveRowStatus,
  type RowStatusTone,
} from '@/features/dashboard/domain/confirmationRowStatus'
import type { ConfirmationRowActionHandlers } from '@/features/dashboard/domain/confirmationRowActions'
import {
  customerDisplayName,
  formatClockTime,
  formatOrderAmount,
  formatOrderNumber,
  formatPhoneInternational,
} from '@/features/dashboard/lib/orderDisplay'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'

/** What the table and the card list both take. */
export interface ConfirmationsListProps {
  rows: VerificationItem[]
  timeZone: string
  canWrite: boolean
  canRetry: boolean
  actingId: string | null
  handlers: ConfirmationRowActionHandlers & {
    onOpenDetails: (row: VerificationItem) => void
  }
}

const BADGE_VARIANTS: Record<RowStatusTone, BadgeProps['variant']> = {
  success: 'success',
  critical: 'danger',
  warning: 'warning',
  neutral: 'neutral',
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

export function OrderCell({
  orderLabel,
  isTest,
}: {
  orderLabel: string
  isTest: boolean
}) {
  const t = useTranslations('dashboard')
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-foreground text-sm font-semibold">
        <bdi dir="ltr">{orderLabel}</bdi>
      </span>
      {isTest && <Badge variant="info">{t('table.testBadge')}</Badge>}
    </div>
  )
}

/** One badge and an optional sub-line, worded by the shared status rules. */
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
    <div className="flex flex-col items-start gap-1">
      <Badge variant={BADGE_VARIANTS[view.tone]}>{t(view.badge)}</Badge>
      {sub && (
        <span
          className={cn(
            'text-xs',
            view.tone === 'critical' && row.status === 'failed'
              ? 'text-destructive-subtle-foreground'
              : 'text-muted-foreground'
          )}
        >
          {sub}
        </span>
      )}
    </div>
  )
}

/** The name, or the phone standing in for it with "No name" below. */
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
    <div className="min-w-0 space-y-0.5">
      <p className="text-foreground truncate text-sm font-semibold">
        {name ?? phoneText}
      </p>
      <p className="text-muted-foreground truncate text-xs">
        {name ? phoneText : t('confirmations.noName')}
      </p>
    </div>
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
    <span
      className={cn(
        'text-sm font-semibold tabular-nums',
        isCanceled ? 'text-muted-foreground line-through' : 'text-foreground'
      )}
    >
      <bdi dir="ltr">{amount}</bdi>
    </span>
  )
}
