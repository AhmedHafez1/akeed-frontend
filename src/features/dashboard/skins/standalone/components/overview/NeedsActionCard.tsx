'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, PackageX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { akCard, akLink } from '@/shared/ui'
import { StatusBadge } from '@/shared/ui/status-badge'
import type { ManualConfirmationTarget } from '@/features/dashboard/domain/useManualConfirmation'
import { NEEDS_ACTION_CARD_LIMIT } from '@/features/dashboard/domain/needsActionRow'
import { useNeedsActionRow } from '@/features/dashboard/domain/useNeedsActionRow'
import { formatTooltipDateTime } from '@/features/dashboard/domain/verificationRow'
import {
  customerDisplayName,
  formatDayAndClock,
  formatOrderAmount,
  formatPhoneInternational,
} from '@/features/dashboard/lib/orderDisplay'
import type {
  DashboardOverview,
  NeedsActionItem,
} from '@/features/dashboard/model/dashboard.model'
import {
  AmountText,
  CardTimes,
  CustomerCell,
  CustomerNameCell,
  DateTimeCell,
  OrderCell,
  PhoneCell,
} from '../confirmations/confirmationCells'
import {
  CARD_ROW,
  NEEDS_ACTION_ROW,
  TABLE,
  TABLE_AMOUNT_CELL,
  TABLE_BODY,
  TABLE_CELL,
  TABLE_HEAD_CELL,
  TABLE_HEAD_ROW,
  TABLE_ROW,
} from '../confirmations/tableStyles'
import { NeedsActionRowActions } from './NeedsActionRowActions'

interface RowProps {
  item: NeedsActionItem
  timeZone: string
  canAct: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onRequestCancel: (target: ManualConfirmationTarget) => void
  listHref: string
  /** Where "Handle request" opens this order's change request. */
  handleHref: (verificationId: string) => string
}

/** Everything a row and a card show, from one item. */
function useRowView({ item, timeZone, canAct }: RowProps) {
  const { locale } = useLocaleInfo()
  const row = useNeedsActionRow(item, timeZone, canAct)
  const name = customerDisplayName(item.customer_name)
  const phone = formatPhoneInternational(item.customer_phone)
  return {
    row,
    name,
    phone,
    amount: formatOrderAmount(item.total_price, item.currency, locale),
    times: {
      orderTime: formatDayAndClock(item.created_at, locale, timeZone),
      orderTimeTitle: formatTooltipDateTime(
        item.created_at ?? null,
        locale,
        timeZone
      ),
      lastUpdate: formatDayAndClock(item.updated_at, locale, timeZone),
      lastUpdateTitle: formatTooltipDateTime(
        item.updated_at ?? null,
        locale,
        timeZone
      ),
    },
    target: {
      verificationId: item.verification_id,
      orderLabel: row.orderLabel,
    },
  }
}

/** The status column: the table's words, with why the order waits on hover. */
function NeedsActionStatus({
  row,
}: {
  row: ReturnType<typeof useNeedsActionRow>
}) {
  const t = useTranslations('dashboard.changeRequest')
  if (row.changeRequest)
    return (
      <span className="inline-flex max-w-full items-center gap-1.5">
        <StatusBadge kind="needsAction" icon={PackageX} title={t('dontShip')}>
          {row.badgeText}
        </StatusBadge>
        {row.changeRequest.ackMissing && (
          <span title={t('ackMissing')} className="text-ak-danger inline-flex">
            <AlertTriangle aria-hidden="true" className="size-4" />
            <span className="sr-only">{t('ackMissing')}</span>
          </span>
        )}
      </span>
    )
  return (
    <StatusBadge kind={row.status.kind} icon={false} title={row.reasonText}>
      {row.badgeText}
    </StatusBadge>
  )
}

/** The card's line under the status: why the order waits. */
function NeedsActionReasonLine({
  row,
}: {
  row: ReturnType<typeof useNeedsActionRow>
}) {
  const t = useTranslations('dashboard.changeRequest')
  if (!row.changeRequest)
    return (
      <p className="text-ak-caption text-ink-muted max-w-full truncate">
        {row.reasonText}
      </p>
    )
  return (
    <>
      <p className="text-ak-caption text-ak-danger flex items-center gap-1.5 font-semibold">
        <PackageX aria-hidden="true" className="size-3.5 shrink-0" />
        {row.reasonText}
      </p>
      {row.changeRequest.ackMissing && (
        <p className="text-ak-caption text-ak-danger flex items-start gap-1.5">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0"
          />
          {t('ackMissing')}
        </p>
      )}
    </>
  )
}

function TableRow(props: RowProps) {
  const { row, name, phone, amount, times, target } = useRowView(props)
  return (
    <tr className={cn(TABLE_ROW, NEEDS_ACTION_ROW)}>
      <td className={TABLE_CELL}>
        <OrderCell orderLabel={row.orderLabel} isTest={false} />
      </td>
      <td className={TABLE_CELL}>
        <DateTimeCell text={times.orderTime} title={times.orderTimeTitle} />
      </td>
      <td className={TABLE_CELL}>
        <CustomerNameCell name={name} />
      </td>
      <td className={TABLE_CELL}>
        <PhoneCell phone={phone} />
      </td>
      <td className={TABLE_CELL}>
        <NeedsActionStatus row={row} />
      </td>
      <td className={TABLE_CELL}>
        <DateTimeCell text={times.lastUpdate} title={times.lastUpdateTitle} />
      </td>
      <td className={TABLE_AMOUNT_CELL}>
        <AmountText amount={amount} isCanceled={false} />
      </td>
      <td className={TABLE_CELL}>
        <NeedsActionRowActions
          row={row}
          target={target}
          customerLabel={name ?? phone}
          listHref={props.listHref}
          handleHref={props.handleHref(props.item.verification_id)}
          onRequestConfirm={props.onRequestConfirm}
          onRequestCancel={props.onRequestCancel}
        />
      </td>
    </tr>
  )
}

/** The Confirmations page's phone card, with the reason written out. */
function CardRow(props: RowProps) {
  const { row, name, phone, amount, times, target } = useRowView(props)
  return (
    <li
      className={cn(
        CARD_ROW,
        NEEDS_ACTION_ROW,
        'border-s-[3px]',
        row.changeRequest ? 'border-ak-danger' : 'border-ak-warning'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <OrderCell orderLabel={row.orderLabel} isTest={false} />
        <AmountText amount={amount} isCanceled={false} />
      </div>
      <CustomerCell name={name} phone={phone} />
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <NeedsActionStatus row={row} />
        <NeedsActionReasonLine row={row} />
      </div>
      <CardTimes {...times} />
      <NeedsActionRowActions
        row={row}
        target={target}
        customerLabel={name ?? phone}
        listHref={props.listHref}
        handleHref={props.handleHref(props.item.verification_id)}
        onRequestConfirm={props.onRequestConfirm}
        onRequestCancel={props.onRequestCancel}
        layout="stacked"
      />
    </li>
  )
}

/* The confirmations table's columns, less Follow-up: every row here waits. */
const HEADINGS = [
  ['order', 'w-[10%]'],
  ['orderTime', 'w-[13%]'],
  ['customer', 'w-[15%]'],
  ['phone', 'w-[15%]'],
  ['status', 'w-[18%]'],
  ['updated', 'w-[12%]'],
  ['total', 'w-[10%] text-end'],
  ['action', 'w-[7%] text-end'],
] as const

/**
 * The orders waiting on the merchant, highest value first (at most three), in
 * the confirmations table's columns and words: a table from `md`, the same
 * phone cards below it. Switched in CSS so server and client render match.
 */
export function NeedsActionCard({
  needsAction,
  timeZone,
  canConfirm,
  onRequestConfirm,
  onRequestCancel,
  viewAllHref,
  handleHref,
}: {
  needsAction: DashboardOverview['needs_action']
  timeZone: string
  canConfirm: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onRequestCancel: (target: ManualConfirmationTarget) => void
  viewAllHref: string
  handleHref: (verificationId: string) => string
}) {
  const t = useTranslations('dashboard.overview.needsAction')
  const tCard = useTranslations('dashboard.standalone.needsAction')
  const tHeadings = useTranslations('dashboard.confirmations.headings')
  const items = needsAction.items.slice(0, NEEDS_ACTION_CARD_LIMIT)
  const hasItems = items.length > 0
  const rowProps = {
    timeZone,
    canAct: canConfirm,
    onRequestConfirm,
    onRequestCancel,
    listHref: viewAllHref,
    handleHref,
  }

  return (
    <section
      aria-labelledby="needs-action-title"
      className={cn(akCard, 'overflow-hidden')}
    >
      <div className="border-line flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b px-6 py-5">
        <div className="min-w-0 space-y-1">
          <h2
            id="needs-action-title"
            className="text-ak-section text-ink flex flex-wrap items-center gap-3"
          >
            {t('title')}
            {needsAction.count > 0 && (
              <span className="border-ak-warning-line bg-ak-warning-soft text-ak-warning text-ak-label inline-flex h-6 items-center rounded-full border px-2.5 whitespace-nowrap tabular-nums">
                {tCard('countPill', { count: needsAction.count })}
              </span>
            )}
          </h2>
        </div>
        <Link href={viewAllHref} className={cn(akLink, 'text-ak-body mt-0.5')}>
          {t('allOrders')}
          <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        </Link>
      </div>
      {!hasItems ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <span className="bg-brand-soft text-brand-ink flex size-10 items-center justify-center rounded-full">
            <CheckCircle2 aria-hidden="true" className="size-5" />
          </span>
          <p className="text-ak-body text-ink mt-3 font-semibold">
            {t('empty')}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className={cn(TABLE, 'min-w-270')}>
              <caption className="sr-only">{t('title')}</caption>
              <thead>
                <tr className={TABLE_HEAD_ROW}>
                  {HEADINGS.map(([heading, width]) => (
                    <th
                      key={heading}
                      scope="col"
                      className={cn(TABLE_HEAD_CELL, width)}
                    >
                      {tHeadings(heading)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={TABLE_BODY}>
                {items.map((item) => (
                  <TableRow
                    key={item.verification_id}
                    item={item}
                    {...rowProps}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-line divide-y md:hidden">
            {items.map((item) => (
              <CardRow key={item.verification_id} item={item} {...rowProps} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
