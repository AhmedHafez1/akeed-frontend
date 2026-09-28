'use client'

import type { MouseEvent } from 'react'
import { ArrowDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { formatDayAndClock } from '@/features/dashboard/lib/orderDisplay'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { ConfirmationRowActions } from './ConfirmationRowActions'
import {
  AmountText,
  CustomerCell,
  FollowUpCell,
  OrderCell,
  StatusCell,
  useConfirmationRowView,
  type ConfirmationsListProps,
} from './confirmationCells'

type RowProps = Omit<ConfirmationsListProps, 'rows'> & {
  row: VerificationItem
}

function useUpdatedAt(row: VerificationItem, timeZone: string) {
  const { locale } = useLocaleInfo()
  return formatDayAndClock(row.updated_at ?? row.created_at, locale, timeZone)
}

/** A click on the row's own controls is theirs, not the row's. */
function isControlClick(event: MouseEvent) {
  return (event.target as HTMLElement).closest(
    'a, button, input, [role="menuitem"]'
  )
}

function TableRow({ row, timeZone, actingId, ...rest }: RowProps) {
  const view = useConfirmationRowView(row)
  const updatedAt = useUpdatedAt(row, timeZone)
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
        'h-[60px] transition-colors',
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
        <CustomerCell name={view.name} phone={view.phone} />
      </td>
      <td className="px-4 py-2.5 align-middle">
        <StatusCell row={row} timeZone={timeZone} />
      </td>
      <td className="px-4 py-2.5 align-middle">
        <FollowUpCell row={row} timeZone={timeZone} />
      </td>
      <td className="px-4 py-2.5 text-end align-middle">
        <AmountText amount={view.amount} isCanceled={view.isCanceled} />
      </td>
      <td className="text-ak-body text-ink-muted px-4 py-2.5 align-middle whitespace-nowrap tabular-nums">
        <bdi>{updatedAt}</bdi>
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

function CardRow({ row, timeZone, actingId, ...rest }: RowProps) {
  const view = useConfirmationRowView(row)
  const updatedAt = useUpdatedAt(row, timeZone)

  return (
    <li
      aria-busy={row.optimistic ? true : undefined}
      className={cn(
        'space-y-3 px-4 py-4',
        row.optimistic && 'bg-surface-sunken'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <OrderCell
          orderLabel={view.orderLabel}
          isTest={row.is_test}
          onOpen={
            row.optimistic ? undefined : () => rest.handlers.onOpenDetails(row)
          }
        />
        <AmountText amount={view.amount} isCanceled={view.isCanceled} />
      </div>
      <CustomerCell name={view.name} phone={view.phone} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusCell row={row} timeZone={timeZone} />
        <FollowUpCell row={row} timeZone={timeZone} showTime />
        <p className="text-ak-caption text-ink-muted tabular-nums">
          <bdi>{updatedAt}</bdi>
        </p>
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
  ['status', 'w-[17%]'],
  ['followUp', 'w-[11%]'],
  ['total', 'w-[11%] text-end'],
  ['updated', 'w-[14%]'],
  ['action', 'w-[15%] text-end'],
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
  const tTable = useTranslations('dashboard.standalone.table')

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="bg-card w-full min-w-[1080px] table-fixed text-start">
          <caption className="sr-only">
            {t('title')}. {tTable('sortedBy')}
          </caption>
          <thead>
            <tr className="border-line bg-surface-sunken text-ak-label text-ink-muted border-b">
              {HEADINGS.map(([heading, width]) => {
                const sorted = heading === 'updated'
                return (
                  <th
                    key={heading}
                    scope="col"
                    aria-sort={sorted ? 'descending' : undefined}
                    className={cn(
                      'h-11 px-4 text-start font-bold whitespace-nowrap first:ps-6 last:pe-6',
                      width,
                      sorted && 'text-ink'
                    )}
                  >
                    {sorted ? (
                      <span className="inline-flex items-center gap-1">
                        {t(`headings.${heading}`)}
                        <ArrowDown aria-hidden="true" className="size-3.5" />
                      </span>
                    ) : (
                      t(`headings.${heading}`)
                    )}
                  </th>
                )
              })}
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
