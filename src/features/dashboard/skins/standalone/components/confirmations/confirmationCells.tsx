'use client'

import { Bell, BellRing, Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { resolveRowStatus } from '@/features/dashboard/domain/confirmationRowStatus'
import { remoteSyncView } from '@/features/dashboard/domain/remoteSync'
import { formatTooltipDateTime } from '@/features/dashboard/domain/verificationRow'
import { useStatusTooltip } from '@/features/dashboard/domain/useStatusTooltip'
import type { ConfirmationRowActionHandlers } from '@/features/dashboard/domain/confirmationRowActions'
import {
  customerDisplayName,
  formatDayAndClock,
  formatOrderAmount,
  formatOrderNumber,
  formatPhoneInternational,
} from '@/features/dashboard/lib/orderDisplay'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { StatusBadge } from '@/shared/ui/status-badge'

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
  const tSync = useTranslations('dashboard.table.storeSync')
  const view = resolveRowStatus(row)
  const statusTitle = useStatusTooltip(row, timeZone)
  // The badge stays the local result; a store that does not have it yet is a
  // second line, never a different badge.
  const syncNote = remoteSyncView(row)?.rowNoteKey
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <StatusBadge kind={view.kind} icon={false} title={statusTitle}>
        {t(view.badge)}
      </StatusBadge>
      {syncNote && (
        <p className="text-ak-caption text-ink-muted flex min-w-0 items-center gap-1.5">
          <Store aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{tSync(syncNote)}</span>
        </p>
      )}
    </div>
  )
}

/** The table's Follow-up column: "Sent", with the time in its tooltip. */
export function FollowUpCell({
  row,
  timeZone,
}: {
  row: VerificationItem
  timeZone: string
}) {
  const t = useTranslations('dashboard.table.followUp')
  const { locale } = useLocaleInfo()
  if (!row.follow_up_sent_at) return null

  const sentAtTitle = formatTooltipDateTime(
    row.follow_up_sent_at,
    locale,
    timeZone
  )
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <StatusBadge kind="pending" icon={false} title={sentAtTitle || undefined}>
        {t('sent')}
      </StatusBadge>
    </div>
  )
}

/**
 * The card's explanation under the status badge: when the reminder went out,
 * or else the status's own sub-line ("Confirmed manually", "Sends 6:40 AM",
 * why a message failed). Nothing when there is nothing to add.
 */
export function StatusNote({
  row,
  timeZone,
}: {
  row: VerificationItem
  timeZone: string
}) {
  const tStatus = useTranslations('dashboard.confirmations.status')
  const tFollowUp = useTranslations('dashboard.table.followUp')
  const { locale } = useLocaleInfo()

  if (row.follow_up_sent_at) {
    const sentAt = formatDayAndClock(row.follow_up_sent_at, locale, timeZone)
    return (
      <p
        title={
          formatTooltipDateTime(row.follow_up_sent_at, locale, timeZone) ||
          undefined
        }
        className="text-ak-caption text-ink-muted flex min-w-0 items-center gap-1.5"
      >
        <BellRing aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="truncate">
          {tFollowUp('sentAt', { time: sentAt })}
        </span>
      </p>
    )
  }

  if (row.follow_up_scheduled_for) {
    const dueAt = formatDayAndClock(
      row.follow_up_scheduled_for,
      locale,
      timeZone
    )
    return (
      <p
        title={
          formatTooltipDateTime(
            row.follow_up_scheduled_for,
            locale,
            timeZone
          ) || undefined
        }
        className="text-ak-caption text-ink-muted flex min-w-0 items-center gap-1.5"
      >
        <Bell aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="truncate">
          {tStatus('tooltip.reminderAt', { time: dueAt })}
        </span>
      </p>
    )
  }

  const view = resolveRowStatus(row)
  if (!view.sub) return null
  const time = view.subTime
    ? formatDayAndClock(view.subTime, locale, timeZone)
    : ''
  return (
    <p className="text-ak-caption text-ink-muted truncate">
      {tStatus(view.sub, { time })}
    </p>
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
      <div className="min-w-0">
        <p className="text-ak-body text-ink truncate font-medium">
          {name ? <bdi>{name}</bdi> : phoneText}
        </p>
        <p className="text-ak-caption text-ink-muted whitespace-nowrap">
          {name ? phoneText : t('confirmations.noName')}
        </p>
      </div>
    </div>
  )
}

export function CustomerNameCell({ name }: { name: string | null }) {
  const t = useTranslations('dashboard')
  return (
    <span
      className={cn('text-ak-body text-ink-muted block max-w-full truncate')}
    >
      {name ? <bdi>{name}</bdi> : t('confirmations.noName')}
    </span>
  )
}

export function PhoneCell({ phone }: { phone: string }) {
  const t = useTranslations('dashboard')
  return (
    <span className="text-ak-caption text-ink block max-w-full truncate font-semibold whitespace-nowrap">
      <bdi dir="ltr" className="tabular-nums">
        {phone || t('table.noPhone')}
      </bdi>
    </span>
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
        isCanceled ? 'line-through' : null,
        'text-ink-muted'
      )}
    >
      <bdi dir="ltr">{amount}</bdi>
    </span>
  )
}
