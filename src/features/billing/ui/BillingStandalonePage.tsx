'use client'

import { useCallback } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button, Skeleton } from '@/shared/ui'
import { useBillingPage } from '../domain/useBillingPage'
import { useTransactions } from '../domain/useTransactions'
import { AccountNotice } from './components/AccountNotice'
import { BalanceHeroCard } from './components/BalanceHeroCard'
import { CheckoutSummaryCard } from './components/CheckoutSummaryCard'
import { RechargePanel } from './components/RechargePanel'
import { RecentActivityCard } from './components/RecentActivityCard'

const RECHARGE_ANCHOR = 'recharge'

export function BillingStandalonePage() {
  const t = useTranslations('billing')
  const state = useBillingPage()
  // The billing page only needs this month: the five newest rows and the
  // month's usage total. Reading further would cost round trips it never shows.
  const history = useTransactions('month')

  const scrollToRecharge = useCallback(() => {
    document
      .getElementById(RECHARGE_ANCHOR)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (state.isSummaryLoading) {
    return (
      <section className="mx-auto max-w-[1400px] space-y-6" aria-busy>
        <Skeleton className="rounded-panel h-40" />
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
      <header>
        <p className="text-primary text-caption font-semibold tracking-[0.18em] uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="text-h1 text-foreground mt-2">{t('title')}</h1>
      </header>

      <BalanceHeroCard summary={summary} onBuyClick={scrollToRecharge} />

      <AccountNotice summary={summary} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <RechargePanel state={state} id={RECHARGE_ANCHOR} />
        <CheckoutSummaryCard state={state} />
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
