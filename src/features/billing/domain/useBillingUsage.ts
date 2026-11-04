'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import { fetchCreditUsage } from '../api/billingApi'
import { isCompleteCreditUsage } from './creditUsage'
import type { PurchaseSummary } from './billing.types'
import { latestSuccessfulPurchase } from './usageInsights'
import { useTransactions } from './useTransactions'

export type BillingUsage =
  | { status: 'loading' | 'unavailable' }
  | {
      status: 'ready'
      usedThisMonth: number
      daily: number[]
      asOf?: string
      lastPurchase: PurchaseSummary | null
    }

/** Usage comes from per-send accounting; pack ledger postings are history. */
export function useBillingUsage(): BillingUsage {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const usage = useQuery({
    queryKey: queryKeys.billing.usage(timeZone),
    queryFn: ({ signal }) => fetchCreditUsage(timeZone, signal),
    refetchInterval: 60_000,
    retry: false,
  })
  const history = useTransactions()
  if (usage.isPending) return { status: 'loading' }
  if (usage.isError || !usage.data || !isCompleteCreditUsage(usage.data))
    return { status: 'unavailable' }
  return {
    status: 'ready',
    asOf: usage.data.asOf,
    usedThisMonth: usage.data.usedThisMonth,
    daily: usage.data.daily.map((day) => day.credits),
    lastPurchase: latestSuccessfulPurchase(history.purchases),
  }
}
