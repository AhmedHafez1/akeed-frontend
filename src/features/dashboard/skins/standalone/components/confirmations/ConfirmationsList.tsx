'use client'

import type { MouseEvent } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { isNeedsActionRow } from '@/features/dashboard/domain/confirmationRowStatus'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { ConfirmationRowActions } from './ConfirmationRowActions'
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
        'h-15 transition-colors',
        row.optimistic
          ? 'bg-surface-sunken'
          : 'hover:bg-surface-sunken cursor-pointer'
      )}
    >
      <td className="px-4 py-2.5 align-middle first:ps-6">
        <OrderCell
          orderLabel={view.orderLabel}
          isTest={row.is_test}
          onOpen={openDetails}
        />
      </td>
      <td className="px-4 py-2.5 align-middle">
        <CustomerNameCell name={view.name} />
      </td>
      <td className="px-4 py-2.5 align-middle">
        <PhoneCell phone={view.phone} />
      </td>
      <td className="px-4 py-2.5 align-middle">
        <StatusCell row={row} timeZone={timeZone} />
      </td>
      <td className="px-4 py-2.5 align-middle">
        <FollowUpCell row={row} timeZone={timeZone} />
      </td>
      <td className="py-2.5 ps-4 pe-6 text-end align-middle">
        <AmountText amount={view.amount} isCanceled={view.isCanceled} />
      </td>
      <td className="px-4 py-2.5 align-middle last:pe-6">
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
 * the merchant carry an amber edge. A tap outside a control opens the
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
        'space-y-3 border-s-[3px] px-4 py-4',
        isNeedsActionRow(row) ? 'border-ak-warning' : 'border-transparent',
        row.optimistic ? 'bg-surface-sunken' : 'cursor-pointer'
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
      <CustomerCell name={view.name} phone={view.phone} />
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <StatusCell row={row} timeZone={timeZone} />
        <StatusNote row={row} timeZone={timeZone} />
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
 * The confirmations list: a seven-column table from `md`, one card per order
 * below it — the same values and actions either way. Switched in CSS rather
 * than by a width hook, so server and first client render always match.
 */
export function ConfirmationsList({
  rows,
  ...rowProps
}: ConfirmationsListProps) {
  const t = useTranslations('dashboard.confirmations')

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="bg-card w-full min-w-270 table-fixed text-start">
          <caption className="sr-only">{t('title')}</caption>
          <thead>
            <tr className="border-line bg-surface-sunken text-ak-label text-ink-muted border-b">
              {HEADINGS.map(([heading, width]) => (
                <th
                  key={heading}
                  scope="col"
                  className={cn(
                    'h-11 px-4 text-start font-bold whitespace-nowrap first:ps-6 last:pe-6',
                    width
                  )}
                >
                  {t(`headings.${heading}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
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
    </>
  )
}
