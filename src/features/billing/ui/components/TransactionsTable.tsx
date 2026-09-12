'use client'

import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import {
  formatCredits,
  formatDayAndTime,
  formatShortRef,
} from '../../domain/billingFormatters'
import type { Transaction } from '../../domain/transactions'
import { useTransactionLabels } from '../../domain/useTransactionLabels'

interface TransactionsTableProps {
  items: Transaction[]
  /** `preview` drops the reference and balance columns for the summary card. */
  variant?: 'preview' | 'full'
  emptyMessage: string
}

function DirectionIcon({ quantity }: { quantity: number }) {
  if (quantity === 0) return <Minus className="size-4" aria-hidden />
  return quantity > 0 ? (
    <ArrowDownLeft className="size-4" aria-hidden />
  ) : (
    <ArrowUpRight className="size-4" aria-hidden />
  )
}

export function TransactionsTable({
  items,
  variant = 'full',
  emptyMessage,
}: TransactionsTableProps) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  const labels = useTransactionLabels()
  const full = variant === 'full'

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-body p-10 text-center">
        {emptyMessage}
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{t('history.date')}</TableHead>
          <TableHead>{t('history.operation')}</TableHead>
          <TableHead className="text-end">{t('history.credits')}</TableHead>
          {full && (
            <TableHead className="text-end">
              {t('history.balanceAfterColumn')}
            </TableHead>
          )}
          {full && <TableHead>{t('history.reference')}</TableHead>}
          <TableHead className="text-end">{t('history.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const { day, time } = formatDayAndTime(item.createdAt, locale)
          const { label, tone } = labels.status(item)
          const positive = item.quantity > 0
          return (
            <TableRow key={item.id}>
              <TableCell className="text-muted-foreground text-caption whitespace-nowrap">
                <span className="text-foreground block font-medium">{day}</span>
                <span dir="ltr" className="block tabular-nums">
                  {time}
                </span>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full',
                      positive
                        ? 'bg-primary-subtle text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <DirectionIcon quantity={item.quantity} />
                  </span>
                  <span className="min-w-0">
                    <span className="text-foreground block font-semibold">
                      {labels.title(item)}
                    </span>
                    <span className="text-muted-foreground text-caption block">
                      {labels.detail(item)}
                    </span>
                  </span>
                </div>
              </TableCell>

              <TableCell
                dir="ltr"
                className={cn(
                  'text-end font-semibold tabular-nums',
                  positive ? 'text-primary' : 'text-foreground'
                )}
              >
                {positive ? '+' : ''}
                {formatCredits(item.quantity, locale)}
              </TableCell>

              {full && (
                <TableCell
                  dir="ltr"
                  className="text-foreground text-end font-medium tabular-nums"
                >
                  {formatCredits(item.balanceAfter, locale)}
                </TableCell>
              )}

              {full && (
                <TableCell className="font-mono text-xs">
                  {item.reference ? (
                    <Link
                      className="text-primary hover:underline"
                      href={withLocale(
                        `/billing/return?purchaseRef=${encodeURIComponent(item.reference)}`,
                        locale
                      )}
                    >
                      <bdi>{formatShortRef(item.reference)}</bdi>
                    </Link>
                  ) : (
                    /*
                     * Usage rows carry no message reference in the ledger API,
                     * so the entry id is the only stable handle a merchant can
                     * quote back to support.
                     */
                    <span className="text-muted-foreground">
                      <bdi>{formatShortRef(item.id)}</bdi>
                    </span>
                  )}
                </TableCell>
              )}

              <TableCell className="text-end">
                <Badge variant={tone}>{label}</Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
