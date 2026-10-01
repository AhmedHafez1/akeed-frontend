'use client'

import { useMemo } from 'react'
import type { PurchaseSummary } from './billing.types'
import { summarize } from './transactions'
import { dailyUsage, latestSuccessfulPurchase } from './usageInsights'
import { useTransactions } from './useTransactions'

export type BillingUsage =
  /** Still reading; `unavailable` is a failed read, or a window too long to read. */
  | { status: 'loading' | 'unavailable' }
  | {
      status: 'ready'
      usedThisMonth: number
      /** Messages per local day over the last 14 days, today last. */
      daily: number[]
      lastPurchase: PurchaseSummary | null
    }

/**
 * What the balance card says about usage: this month's total, the 14-day
 * chart and the last purchase. It reports `ready` only once the ledger reaches
 * back past the whole window, so a half-read total never shows as the answer.
 */
export function useBillingUsage(): BillingUsage {
  const history = useTransactions('month')
  const { transactions, purchases } = history

  const figures = useMemo(
    () => ({
      usedThisMonth: summarize(transactions).usedThisMonth,
      daily: dailyUsage(transactions),
      lastPurchase: latestSuccessfulPurchase(purchases),
    }),
    [purchases, transactions]
  )

  if (history.error) return { status: 'unavailable' }
  if (history.isLoading) return { status: 'loading' }
  if (!history.isWindowCovered)
    // Past the drain cap the total would be an under-count, so none is shown.
    return { status: history.isComplete ? 'loading' : 'unavailable' }
  return { status: 'ready', ...figures }
}
