'use client'

import type { MouseEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import { cn } from '@/shared/lib/utils'
import { isNeedsActionRow } from '@/features/dashboard/domain/confirmationRowStatus'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { ConfirmationRowActions } from './ConfirmationRowActions'
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
} from './tableStyles'
import {
  AmountText,
  CustomerCell,
  CustomerNameCell,
  FollowUpCell,
  OrderCell,
  PhoneCell,
  StatusCell,
  StatusNote,
  useConfirmationRowView,
  type ConfirmationsListProps,
} from './confirmationCells'

type RowProps = Omit<ConfirmationsListProps, 'rows'> & {
  row: VerificationItem
}

/** A click on the row's own controls is theirs, not the row's. */
function isControlClick(event: MouseEvent) {
  return (event.target as HTMLElement).closest(
    'a, button, input, [role="menuitem"]'
  )
}

function TableRow({ row, timeZone, actingId, ...rest }: RowProps) {
  const view = useConfirmationRowView(row)
  // The Order cell's button is the keyboard route to the same details.
  const openDetails = row.optimistic
    ? undefined
    : () => rest.handlers.onOpenDetails(row)

  return (
    <tr
      aria-busy={row.optimistic ? true : undefined}
      onClick={(event) => {
        if (openDetails && !isControlClick(event)) openDetails()
      }}
      className={cn(
        TABLE_ROW,
        row.optimistic
          ? 'bg-surface-sunken'
          : cn(
              'cursor-pointer',
              isNeedsActionRow(row)
                ? NEEDS_ACTION_ROW
                : 'hover:bg-surface-sunken'
            )
      )}
    >
      <td className={TABLE_CELL}>
        <OrderCell
          orderLabel={view.orderLabel}
          isTest={row.is_test}
          onOpen={openDetails}
        />
      </td>
      <td className={TABLE_CELL}>
        <CustomerNameCell name={view.name} />
      </td>
      <td className={TABLE_CELL}>
        <PhoneCell phone={view.phone} />
      </td>
      <td className={TABLE_CELL}>
        <StatusCell row={row} timeZone={timeZone} />
      </td>
      <td className={TABLE_CELL}>
        <FollowUpCell row={row} timeZone={timeZone} />
      </td>
      <td className={TABLE_AMOUNT_CELL}>
        <AmountText amount={view.amount} isCanceled={view.isCanceled} />
      </td>
      <td className={TABLE_CELL}>
        <ConfirmationRowActions
          row={row}
          orderLabel={view.orderLabel}
          isActing={actingId === row.id}
          isAnyActing={actingId !== null}
          {...rest}
        />
      </td>
    </tr>
  )
}

/**
 * One order on a phone: order and amount, then who, then what happened (the
 * badge and a plain-words note under it), then the actions. Orders waiting on
 * the merchant carry an amber background. A tap outside a control opens the
 * details; the order number stays the keyboard route.
 */
function CardRow({ row, timeZone, actingId, ...rest }: RowProps) {
  const view = useConfirmationRowView(row)
  const openDetails = row.optimistic
    ? undefined
    : () => rest.handlers.onOpenDetails(row)

  return (
    <li
      aria-busy={row.optimistic ? true : undefined}
      onClick={(event) => {
        if (openDetails && !isControlClick(event)) openDetails()
      }}
      className={cn(
        CARD_ROW,
        row.optimistic
          ? 'bg-surface-sunken'
          : cn('cursor-pointer', isNeedsActionRow(row) && NEEDS_ACTION_ROW)
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <OrderCell
          orderLabel={view.orderLabel}
          isTest={row.is_test}
          onOpen={openDetails}
        />
        <AmountText amount={view.amount} isCanceled={view.isCanceled} />
      </div>
      <div className="flex items-start justify-between gap-3">
        <CustomerCell name={view.name} phone={view.phone} />
        <div className="flex min-w-0 shrink-0 flex-col items-end gap-1.5 text-end">
          <StatusCell row={row} timeZone={timeZone} />
          <StatusNote row={row} timeZone={timeZone} />
        </div>
      </div>
      <ConfirmationRowActions
        row={row}
        orderLabel={view.orderLabel}
        isActing={actingId === row.id}
        isAnyActing={actingId !== null}
        layout="stacked"
        {...rest}
      />
    </li>
  )
}

/*
 * Share of the table per column. The table is fixed-layout with a minimum
 * width, so a narrow window scrolls it sideways instead of squeezing the
 * phone or the action buttons onto a second line.
 */
const HEADINGS = [
  ['order', 'w-[12%]'],
  ['customer', 'w-[20%]'],
  ['phone', 'w-[18%]'],
  ['status', 'w-[18%]'],
  ['followUp', 'w-[12%]'],
  ['total', 'w-[12%] text-end'],
  ['action', 'w-[8%] text-end'],
] as const

/** The list's own scroll area: tall enough to fill a screen, never taller. */
const SCROLL_AREA = 'max-h-[calc(100dvh-20rem)] min-h-64 overflow-auto'

interface ConfirmationsScrollProps {
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  /** Rows loaded and rows in all, announced to screen readers as it grows. */
  loadedLabel: string
}

/**
 * The confirmations list: a seven-column table from `md`, one card per order
 * below it — the same values and actions either way. Switched in CSS rather
 * than by a width hook, so server and first client render always match.
 *
 * The rows scroll inside the card so the headings stay in view, and the next
 * page loads when the end comes near. `tabIndex` makes the area scrollable
 * from the keyboard.
 */
export function ConfirmationsList({
  rows,
  hasMore,
  isLoadingMore,
  onLoadMore,
  loadedLabel,
  ...rowProps
}: ConfirmationsListProps & ConfirmationsScrollProps) {
  const t = useTranslations('dashboard.confirmations')
  const { rootRef, sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore,
  })

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-label={t('title')}
      className={cn(SCROLL_AREA, 'ak-focus')}
    >
      <div className="hidden md:block">
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
                  {t(`headings.${heading}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={TABLE_BODY}>
            {rows.map((row) => (
              <TableRow key={row.id} row={row} {...rowProps} />
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-line divide-y md:hidden">
        {rows.map((row) => (
          <CardRow key={row.id} row={row} {...rowProps} />
        ))}
      </ul>

      <p role="status" className="sr-only">
        {loadedLabel}
      </p>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      {isLoadingMore && (
        <div
          role="status"
          className="text-ink-muted flex items-center justify-center gap-2 py-3"
        >
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          <span className="text-ak-caption">{t('loadingMore')}</span>
        </div>
      )}
    </div>
  )
}
