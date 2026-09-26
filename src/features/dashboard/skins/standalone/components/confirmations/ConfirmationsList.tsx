'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { isNeedsActionRow } from '@/features/dashboard/domain/confirmationRowStatus'
import { formatUpdatedAt } from '@/features/dashboard/lib/orderDisplay'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'
import { ConfirmationRowActions } from './ConfirmationRowActions'
import {
  AmountText,
  CustomerCell,
  OrderCell,
  StatusCell,
  useConfirmationRowView,
  type ConfirmationsListProps,
} from './confirmationCells'

type RowProps = Omit<ConfirmationsListProps, 'rows'> & {
  row: VerificationItem
}

/** Amber for rows waiting on the merchant; muted for rows not saved yet. */
function rowTone(row: VerificationItem) {
  if (row.optimistic) return 'bg-muted/60'
  return isNeedsActionRow(row) ? 'bg-warning-subtle/60' : undefined
}

function useUpdatedAt(row: VerificationItem, timeZone: string) {
  const { locale } = useLocaleInfo()
  return formatUpdatedAt(row.updated_at ?? row.created_at, locale, timeZone)
}

function TableRow({ row, timeZone, actingId, ...rest }: RowProps) {
  const view = useConfirmationRowView(row)
  const updatedAt = useUpdatedAt(row, timeZone)

  return (
    <tr
      aria-busy={row.optimistic ? true : undefined}
      className={cn('hover:bg-muted/50 transition-colors', rowTone(row))}
    >
      <td className="px-4 py-3 align-middle">
        <OrderCell orderLabel={view.orderLabel} isTest={row.is_test} />
      </td>
      <td className="max-w-0 px-4 py-3 align-middle">
        <CustomerCell name={view.name} phone={view.phone} />
      </td>
      <td className="px-4 py-3 align-middle">
        <StatusCell row={row} timeZone={timeZone} />
      </td>
      <td className="px-4 py-3 align-middle">
        <AmountText amount={view.amount} isCanceled={view.isCanceled} />
      </td>
      <td className="text-muted-foreground px-4 py-3 align-middle text-xs">
        {updatedAt}
      </td>
      <td className="px-4 py-3 align-middle">
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
      className={cn('space-y-3 px-4 py-4', rowTone(row))}
    >
      <div className="flex items-center justify-between gap-3">
        <OrderCell orderLabel={view.orderLabel} isTest={row.is_test} />
        <AmountText amount={view.amount} isCanceled={view.isCanceled} />
      </div>
      <div className="flex items-start justify-between gap-3">
        <CustomerCell name={view.name} phone={view.phone} />
        <StatusCell row={row} timeZone={timeZone} />
      </div>
      <p className="text-muted-foreground text-xs">{updatedAt}</p>
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

const HEADINGS = [
  ['order', 'w-[10%]'],
  ['customer', 'w-[22%]'],
  ['status', 'w-[19%]'],
  ['total', 'w-[12%]'],
  ['updated', 'w-[13%]'],
  ['action', 'w-[24%] text-end'],
] as const

/**
 * The confirmations list: a six-column table from `md`, one card per order
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
      <table className="hidden w-full table-fixed text-start md:table">
        <caption className="sr-only">{t('title')}</caption>
        <thead>
          <tr className="border-border bg-muted/50 text-muted-foreground border-b text-xs font-medium">
            {HEADINGS.map(([heading, width]) => (
              <th
                key={heading}
                scope="col"
                className={cn('px-4 py-3 text-start', width)}
              >
                {t(`headings.${heading}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((row) => (
            <TableRow key={row.id} row={row} {...rowProps} />
          ))}
        </tbody>
      </table>

      <ul className="divide-border divide-y md:hidden">
        {rows.map((row) => (
          <CardRow key={row.id} row={row} {...rowProps} />
        ))}
      </ul>
    </>
  )
}
