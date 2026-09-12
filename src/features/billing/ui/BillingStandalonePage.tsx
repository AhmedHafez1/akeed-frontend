'use client'

import { useCallback, useMemo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Button, Skeleton } from '@/shared/ui'
import { summarize, coversCurrentMonth } from '../domain/transactions'
import { useBillingPage } from '../domain/useBillingPage'
import { useTransactions } from '../domain/useTransactions'
import { AccountNotice } from './components/AccountNotice'
import { BalanceHeroCard } from './components/BalanceHeroCard'
import { CreditMetricTiles } from './components/CreditMetricTiles'
import { RechargePanel } from './components/RechargePanel'
import { RecentActivityCard } from './components/RecentActivityCard'
import { HowCreditsWorkCard, LaunchGiftCard } from './components/SidePanels'

const RECHARGE_ANCHOR = 'recharge'

export function BillingStandalonePage() {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  const state = useBillingPage()
  // The billing page only needs this month: the five newest rows and the
  // month's usage total. Reading further would cost round trips it never shows.
  const history = useTransactions('month')

  const scrollToRecharge = useCallback(() => {
    document
      .getElementById(RECHARGE_ANCHOR)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const monthly = useMemo(() => {
    const totals = summarize(history.transactions)
    return {
      used: totals.usedThisMonth,
      exact: coversCurrentMonth(history.transactions, history.isComplete),
    }
  }, [history.isComplete, history.transactions])

  const monthStartLabel = useMemo(() => {
    const now = new Date()
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
      new Date(now.getFullYear(), now.getMonth(), 1)
    )
  }, [locale])

  if (state.isSummaryLoading) {
    return (
      <section className="mx-auto max-w-[1400px] space-y-6" aria-busy>
        <Skeleton className="rounded-panel h-40" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((tile) => (
            <Skeleton key={tile} className="rounded-card h-32" />
          ))}
        </div>
        <Skeleton className="rounded-card h-96" />
      </section>
    )
  }

  if (!state.summary || state.summaryError) {
    return (
      <section className="mx-auto max-w-2xl py-16 text-center" role="alert">
        <div className="text-destructive mx-auto grid size-12 place-items-center rounded-full bg-red-50 dark:bg-red-950">
          <AlertTriangle />
        </div>
        <h1 className="text-h3 mt-4">{t('error.title')}</h1>
        <p className="text-muted-foreground text-body mt-2">
          {t('error.description')}
        </p>
        <Button className="mt-5" onClick={() => void state.refreshSummary()}>
          <RefreshCw /> {t('retry')}
        </Button>
      </section>
    )
  }

  const summary = state.summary

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-primary text-caption font-semibold tracking-[0.18em] uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="text-h1 text-foreground mt-2">{t('title')}</h1>
          <p className="text-muted-foreground text-body mt-2 max-w-2xl">
            {t('description')}
          </p>
        </div>
        <p className="text-muted-foreground text-caption">
          {t('threshold', { count: summary.lowBalanceThreshold })}
        </p>
      </header>

      <BalanceHeroCard summary={summary} onBuyClick={scrollToRecharge} />

      <CreditMetricTiles
        summary={summary}
        messagesThisMonth={monthly.used}
        messagesExact={monthly.exact}
        monthStartLabel={monthStartLabel}
      />

      <AccountNotice summary={summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <RechargePanel state={state} id={RECHARGE_ANCHOR} />
        <div className="space-y-6">
          <LaunchGiftCard summary={summary} />
          <HowCreditsWorkCard />
        </div>
      </div>

      <RecentActivityCard
        items={history.transactions}
        isLoading={history.isLoading}
        error={history.error}
        onRetry={() => void history.reload()}
      />
    </section>
  )
}
