'use client'

import type { MouseEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
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

/**
 * The table's own scroll area from `md`: it takes the height the page leaves
 * it (the page is one screen tall there) and shrinks to its rows when they are
 * few. On a phone the cards flow and the page scrolls: the header, tabs and
 * search already use most of the screen, so a capped box there would be a
 * second, small scroller inside the page.
 *
 * `relative` keeps the `sr-only` text of the rows inside the scroll area. It
 * is absolutely positioned, so without a positioned ancestor here it would sit
 * at its unscrolled offset in the page and stretch the document below the card.
 */
const SCROLL_AREA = 'relative md:min-h-64 md:overflow-auto'

/** Tailwind's `md` breakpoint, where the table replaces the cards. */
const TABLE_QUERY = '(min-width: 48rem)'

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
 * The table rows scroll inside the card so the headings stay in view; the cards
 * scroll with the page. Either way the next page loads when the end comes
 * near. `tabIndex` makes the table's area scrollable from the keyboard.
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
  const isTableLayout = useMediaQuery(TABLE_QUERY)
  const { rootRef, sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore,
    scrollRoot: isTableLayout ? 'element' : 'viewport',
  })

  return (
    <div
      ref={rootRef}
      tabIndex={isTableLayout ? 0 : undefined}
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
