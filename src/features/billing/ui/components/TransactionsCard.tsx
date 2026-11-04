'use client'

import { useId } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard, Skeleton } from '@/shared/ui'
import {
  formatBillingDate,
  formatCredits,
  formatMoney,
} from '../../domain/billingFormatters'
import type { UseTransactionsResult } from '../../domain/useTransactions'

/** The newest postings shown; the history behind them is the ledger's. */
const SHOWN = 8

/**
 * The latest ledger postings: top-ups, sends, packs and returns, each with
 * the balance after it. History only: usage figures come from the per-send
 * totals above, never from adding these rows up.
 */
export function TransactionsCard({
  history,
}: {
  history: UseTransactionsResult
}) {
  const t = useTranslations('billing.transactions')
  const { locale } = useLocaleInfo()
  const headingId = useId()
  const rows = history.transactions.slice(0, SHOWN)

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-ak-section text-ink">
        {t('title')}
      </h2>
      <div className={cn(akCard, 'overflow-hidden')}>
        {history.isLoading ? (
          <div className="space-y-3 p-5 sm:p-6" aria-busy="true">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ) : history.error ? (
          <div
            role="alert"
            className="text-ak-body text-ak-danger flex flex-wrap items-center gap-3 p-5 sm:p-6"
          >
            <AlertTriangle aria-hidden="true" className="size-4.5 shrink-0" />
            <p className="min-w-0 flex-1">{t('error')}</p>
            <button
              type="button"
              onClick={() => void history.reload()}
              className={akButton({ variant: 'secondary', size: 'table' })}
            >
              {t('retry')}
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p className="text-ak-body text-ink-muted p-5 sm:p-6">{t('empty')}</p>
        ) : (
          <div className="overflow-x-auto px-5 pt-4 sm:px-6">
            <table className="w-full min-w-120 text-start">
              <thead>
                <tr className="bg-surface-sunken text-ak-caption text-ink-muted">
                  {(['transaction', 'date', 'credits', 'balance'] as const).map(
                    (column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-3 py-2.5 text-start font-semibold first:rounded-s-md last:rounded-e-md"
                      >
                        {t(`columns.${column}`)}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-line text-ak-body border-b last:border-b-0"
                  >
                    <th
                      scope="row"
                      className="text-ink px-3 py-3 text-start font-semibold"
                    >
                      {t(`types.${row.ledgerType}`)}
                      {row.ledgerType === 'own_number_pack' && (
                        <span className="text-ak-caption text-ink-muted ms-2 font-normal">
                          {t('packNote')}
                        </span>
                      )}
                      {row.purchase && (
                        <span className="text-ak-caption text-ink-muted ms-2 font-normal">
                          <bdi>
                            {formatMoney(
                              row.purchase.totalMinor,
                              row.purchase.currency,
                              locale
                            )}
                          </bdi>
                        </span>
                      )}
                    </th>
                    <td className="text-ink-muted px-3 py-3 whitespace-nowrap">
                      {formatBillingDate(row.createdAt, locale)}
                    </td>
                    <td
                      dir="ltr"
                      className={cn(
                        'px-3 py-3 text-start tabular-nums',
                        row.quantity > 0 ? 'text-brand-ink' : 'text-ink'
                      )}
                    >
                      {row.quantity > 0 ? '+' : ''}
                      {formatCredits(row.quantity, locale)}
                    </td>
                    <td
                      dir="ltr"
                      className="text-ink px-3 py-3 text-start tabular-nums"
                    >
                      {formatCredits(row.balanceAfter, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-ak-caption text-ink-muted border-line border-t px-5 py-3 sm:px-6">
          {t('note')}
        </p>
      </div>
    </section>
  )
}
