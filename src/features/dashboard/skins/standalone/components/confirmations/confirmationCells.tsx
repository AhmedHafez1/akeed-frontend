'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { resolveRowStatus } from '@/features/dashboard/domain/confirmationRowStatus'
import type { ConfirmationRowActionHandlers } from '@/features/dashboard/domain/confirmationRowActions'
import {
  customerDisplayName,
  formatClockTime,
  formatOrderAmount,
  formatOrderNumber,
  formatPhoneInternational,
} from '@/features/dashboard/lib/orderDisplay'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { InitialsAvatar } from '../shared/InitialsAvatar'
import { StatusBadge } from '../shared/StatusBadge'

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
    amount: formatOrderAmount(row.total_price, row.currency, locale, {
      currencyAfter: true,
    }),
    isCanceled: row.status === 'canceled',
  }
}

/** The order number, as the link that opens the row's details. */
export function OrderCell({
  orderLabel,
  isTest,
  onOpen,
}: {
  orderLabel: string
  isTest: boolean
  onOpen?: () => void
}) {
  const t = useTranslations('dashboard')
  const tTable = useTranslations('dashboard.standalone.table')
  const label = <bdi dir="ltr">{orderLabel}</bdi>
  return (
    <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={tTable('openDetails', { order: orderLabel })}
          title={orderLabel}
          className="ak-focus text-ak-body text-ink max-w-[10ch] min-w-0 truncate rounded-sm font-semibold tabular-nums underline-offset-4 hover:underline"
        >
          {label}
        </button>
      ) : (
        <span
          title={orderLabel}
          className="text-ak-body text-ink max-w-[10ch] min-w-0 truncate font-semibold tabular-nums"
        >
          {label}
        </span>
      )}
      {isTest && (
        <span className="bg-neutral-soft text-ink-muted text-ak-label inline-flex h-5 items-center rounded-full px-2">
          {t('table.testBadge')}
        </span>
      )}
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
    <div className="flex min-w-0 flex-col items-start gap-1">
      <StatusBadge kind={view.kind}>
        {t(view.badge)}
      </StatusBadge>
      {sub && (
        <span
          className={cn(
            'text-ak-caption max-w-full truncate first-letter:uppercase',
            view.kind === 'failed' ? 'text-ak-danger' : 'text-ink-muted'
          )}
        >
          {sub}
        </span>
      )}
    </div>
  )
}

/**
 * Avatar, the name, and the phone under it on one line — or the phone
 * standing in for the name with "No name" below.
 */
export function CustomerCell({
  name,
  phone,
}: {
  name: string | null
  phone: string
}) {
  const t = useTranslations('dashboard')
  const phoneText = (
    <bdi dir="ltr" className="tabular-nums">
      {phone || t('table.noPhone')}
    </bdi>
  )
  return (
    <div className="flex min-w-0 items-center gap-3">
      <InitialsAvatar name={name} size={32} />
      <div className="min-w-0">
        <p className="text-ak-body text-ink truncate font-semibold">
          {name ? <bdi>{name}</bdi> : phoneText}
        </p>
        <p className="text-ak-caption text-ink-muted whitespace-nowrap">
          {name ? phoneText : t('confirmations.noName')}
        </p>
      </div>
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
        'text-ak-body font-semibold whitespace-nowrap tabular-nums',
        isCanceled ? 'text-ink-muted line-through' : 'text-ink'
      )}
    >
      <bdi dir="ltr">{amount}</bdi>
    </span>
  )
}
