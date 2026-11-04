'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import { fetchCreditUsage } from '../api/billingApi'
import { isCompleteCreditUsage } from './creditUsage'
import type { PurchaseSummary } from './billing.types'
import { dailyUsage, latestSuccessfulPurchase } from './usageInsights'
import { useTransactions } from './useTransactions'

export type BillingUsage =
  | { status: 'loading' | 'unavailable' }
  | {
      status: 'ready'
      usedThisMonth: number
      /** This month's credits by the number each message went from. */
      bySender: { akeed: number; ownNumber: number }
      daily: number[]
      /** The same 14 days, split by sender. */
      dailyBySender: { akeed: number[]; ownNumber: number[] }
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
  const days = dailyUsage(usage.data)
  return {
    status: 'ready',
    asOf: usage.data.asOf,
    usedThisMonth: usage.data.usedThisMonth,
    bySender: usage.data.bySender,
    daily: days.total,
    dailyBySender: { akeed: days.akeed, ownNumber: days.ownNumber },
    lastPurchase: latestSuccessfulPurchase(history.purchases),
  }
}
