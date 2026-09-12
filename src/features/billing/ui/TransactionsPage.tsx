'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Download, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { Button, Card, Pagination, Skeleton } from '@/shared/ui'
import { formatBillingDate, formatCredits } from '../domain/billingFormatters'
import { toCsv } from '../domain/transactions'
import { useBillingSummary } from '../domain/useBillingSummary'
import { useTransactionsLog } from '../domain/useTransactionsLog'
import { downloadCsv } from '../lib/csvDownload'
import { TransactionsTable } from './components/TransactionsTable'
import { TransactionsToolbar } from './components/TransactionsToolbar'

export function TransactionsPage() {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  const log = useTransactionsLog()
  const { summary } = useBillingSummary()

  const { filtered, labels } = log
  const exportCsv = useCallback(() => {
    const header = [
      t('transactions.csv.date'),
      t('transactions.csv.operation'),
      t('transactions.csv.reason'),
      t('transactions.csv.credits'),
      t('transactions.csv.balanceAfter'),
      t('transactions.csv.status'),
      t('transactions.csv.reference'),
    ]
    const rows = filtered.map((item) => [
      formatBillingDate(item.createdAt, locale),
      labels.title(item),
      labels.detail(item),
      String(item.quantity),
      String(item.balanceAfter),
      labels.status(item).label,
      item.reference ?? item.id,
    ])
    downloadCsv(toCsv([header, ...rows]), t('transactions.csv.filename'))
  }, [filtered, labels, locale, t])

  const tiles = [
    {
      key: 'balance',
      label: t('transactions.summary.balance'),
      value: summary ? formatCredits(summary.availableCredits, locale) : '—',
    },
    {
      key: 'purchased',
      label: t('transactions.summary.purchased'),
      value: formatCredits(log.totals.purchasedTotal, locale),
    },
    {
      key: 'used',
      label: t('transactions.summary.usedThisMonth'),
      value: formatCredits(log.totals.usedThisMonth, locale),
    },
    {
      key: 'count',
      label: t('transactions.summary.count'),
      value: formatCredits(log.totals.count, locale),
    },
  ]

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 pb-8">
      <Link
        href={withLocale('/billing', locale)}
        className="text-primary text-body inline-flex items-center gap-1.5 font-medium hover:underline"
      >
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
        {t('transactions.back')}
      </Link>

      <header>
        <p className="text-primary text-caption font-semibold tracking-[0.18em] uppercase">
          {t('transactions.eyebrow')}
        </p>
        <h1 className="text-h1 text-foreground mt-2">
          {t('transactions.title')}
        </h1>
        <p className="text-muted-foreground text-body mt-2 max-w-2xl">
          {t('transactions.description')}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.key} className="p-5">
            <p className="text-muted-foreground text-body font-medium">
              {tile.label}
            </p>
            <p className="text-foreground mt-2 text-3xl font-bold">
              <span dir="ltr" className="tabular-nums">
                {tile.value}
              </span>
            </p>
          </Card>
        ))}
      </div>

      <TransactionsToolbar filters={log.filters} onChange={log.setFilter} />

      <Card className="overflow-hidden">
        <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6">
          <div>
            <h2 className="text-h3 text-foreground">
              {t('transactions.listTitle')}
            </h2>
            <p className="text-muted-foreground text-body mt-1">
              {t('transactions.listDescription', { count: log.totals.count })}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            <Download aria-hidden />
            {t('transactions.export')}
          </Button>
        </div>

        {log.error ? (
          <div className="p-10 text-center">
            <AlertTriangle
              className="text-destructive mx-auto size-6"
              aria-hidden
            />
            <p className="text-body text-destructive mt-3">
              {t('history.error')}
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => void log.reload()}
            >
              <RefreshCw /> {t('retry')}
            </Button>
          </div>
        ) : log.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="rounded-control h-12" />
            ))}
          </div>
        ) : (
          <TransactionsTable
            items={log.page.rows}
            emptyMessage={
              log.isFiltered
                ? t('transactions.emptyFiltered')
                : t('transactions.empty')
            }
          />
        )}

        {!log.error && !log.isLoading && (
          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t p-4">
            <p className="text-muted-foreground text-caption">
              {t('transactions.showing', {
                from: log.page.from,
                to: log.page.to,
                total: log.page.total,
              })}
            </p>
            <Pagination
              page={log.page.page}
              pageCount={log.page.pageCount}
              onPageChange={log.setPage}
              labels={{
                previous: t('transactions.pagination.previous'),
                next: t('transactions.pagination.next'),
                page: t('transactions.pagination.page'),
              }}
            />
          </div>
        )}
      </Card>

      {/*
       * Filtering happens in the browser, so it can only be honest about rows
       * that have actually been fetched. When the drain stopped at its cap the
       * page says so instead of implying the filters covered everything.
       */}
      {!log.isComplete && !log.isLoading && (
        <div className="border-border rounded-card text-body flex flex-wrap items-center justify-between gap-3 border border-dashed p-4">
          <p className="text-muted-foreground">
            {t('transactions.capped', { count: log.totals.count })}
          </p>
          <Button
            variant="outline"
            onClick={log.loadMore}
            disabled={log.isDraining}
          >
            {log.isDraining && <RefreshCw className="animate-spin" />}
            {t('transactions.loadMore')}
          </Button>
        </div>
      )}
    </section>
  )
}
