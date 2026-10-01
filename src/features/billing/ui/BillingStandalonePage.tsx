'use client'

import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard, Skeleton } from '@/shared/ui'
import { useBillingPage } from '../domain/useBillingPage'
import { useBillingUsage } from '../domain/useBillingUsage'
import { BalanceCard } from './components/BalanceCard'
import { BillingAlert } from './components/BillingAlert'
import { CheckoutSummaryCard } from './components/CheckoutSummaryCard'
import { RechargePanel } from './components/RechargePanel'

/** One column below 1100px; the amount beside a 360px summary from there up. */
const buyGrid =
  'grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]'

function PageShell({
  children,
  busy,
}: {
  children: ReactNode
  busy?: boolean
}) {
  const t = useTranslations('billing')
  return (
    <div
      className="mx-auto w-full max-w-295 space-y-6 pt-2 pb-8"
      aria-busy={busy || undefined}
    >
      <header className="space-y-1">
        <h1 className="text-ak-title text-ink">{t('title')}</h1>
        <p className="text-ak-body text-ink-muted">{t('subtitle')}</p>
      </header>
      {children}
    </div>
  )
}

/**
 * Billing & credits: the balance and its state, one alert when the balance
 * needs attention, then the amount to buy beside the order summary. Pay is
 * the page's one primary action.
 */
export function BillingStandalonePage() {
  const t = useTranslations('billing')
  const state = useBillingPage()
  const usage = useBillingUsage()

  if (state.isSummaryLoading) {
    return (
      <PageShell busy>
        <Skeleton className="rounded-ak-card h-60" />
        <div className={buyGrid}>
          <Skeleton className="rounded-ak-card h-80" />
          <Skeleton className="rounded-ak-card h-80" />
        </div>
      </PageShell>
    )
  }

  if (!state.summary || state.summaryError) {
    return (
      <PageShell>
        <div
          role="alert"
          className={cn(
            akCard,
            'mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-10 text-center'
          )}
        >
          <span className="bg-ak-danger-soft text-ak-danger flex size-10 items-center justify-center rounded-full">
            <AlertTriangle aria-hidden="true" className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-ak-section text-ink">{t('error.title')}</p>
            <p className="text-ak-body text-ink-muted">
              {t('error.description')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void state.refreshSummary()}
            className={akButton({ variant: 'secondary' })}
          >
            {t('retry')}
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <BalanceCard summary={state.summary} usage={usage} />
      <BillingAlert summary={state.summary} />
      <div className={buyGrid}>
        <RechargePanel state={state} />
        <CheckoutSummaryCard state={state} />
      </div>
    </PageShell>
  )
}
