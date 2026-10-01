'use client'

import { useCallback, useEffect, useMemo } from 'react'
import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import {
  DRAIN_PAGE_SIZE,
  ledgerInfiniteOptions,
  purchasesInfiniteOptions,
} from '../api/billingQueries'
import type { PagedResponse, PurchaseSummary } from './billing.types'
import {
  buildTransactions,
  coversSince,
  type Transaction,
} from './transactions'
import { usageWindowStart } from './usageInsights'

/**
 * The most 100-row pages to pull while reading back to the start of the
 * billing page's window. A tenant that spends more than 1,000 entries inside
 * it gets no usage total rather than an under-count.
 */
const MAX_PAGES = 10

type InfiniteResult<T> = UseInfiniteQueryResult<
  { pages: PagedResponse<T>[] },
  unknown
>

/**
 * Keeps pulling the next cursor page until the feed is exhausted, `cap` is
 * reached, or the caller has seen enough. TanStack serialises the calls for us
 * — a `fetchNextPage` issued while one is in flight is ignored — so this stays
 * a single-page-at-a-time walk rather than a burst.
 */
function useDrain<T>(
  query: InfiniteResult<T>,
  cap: number,
  satisfied: boolean
) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage, data } = query
  const loadedPages = data?.pages.length ?? 0

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || satisfied) return
    if (loadedPages >= cap) return
    void fetchNextPage()
  }, [
    cap,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loadedPages,
    satisfied,
  ])

  return { loadedPages, reachedCap: hasNextPage === true && loadedPages >= cap }
}

export interface UseTransactionsResult {
  transactions: Transaction[]
  /** The purchases loaded so far, newest first, whatever their status. */
  purchases: PurchaseSummary[]
  /** False when the drain stopped at its cap with pages still unread. */
  isComplete: boolean
  /**
   * True once the loaded ledger reaches back past the billing page's window
   * (`usageWindowStart`), so this month's usage and the 14-day chart are whole.
   */
  isWindowCovered: boolean
  isLoading: boolean
  isDraining: boolean
  error: boolean
  reload: () => Promise<void>
}

/**
 * The ledger and the purchases behind the billing page's usage figures, read
 * back only as far as its window: this month's total and the 14-day chart.
 */
export function useTransactions(): UseTransactionsResult {
  const ledgerQuery = useInfiniteQuery(ledgerInfiniteOptions(DRAIN_PAGE_SIZE))
  const purchasesQuery = useInfiniteQuery(
    purchasesInfiniteOptions(DRAIN_PAGE_SIZE)
  )

  const purchases = useMemo(
    () => purchasesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [purchasesQuery.data]
  )

  const transactions = useMemo(
    () =>
      buildTransactions(
        ledgerQuery.data?.pages.flatMap((page) => page.items) ?? [],
        purchases
      ),
    [ledgerQuery.data, purchases]
  )

  /*
   * Both feeds arrive newest-first, so once the oldest loaded row predates the
   * window there is nothing left in it to find and the walk can stop.
   */
  const windowStart = usageWindowStart()
  const satisfied = coversSince(transactions, false, windowStart)
  const isLedgerExhausted =
    ledgerQuery.data !== undefined && !ledgerQuery.hasNextPage

  const ledgerDrain = useDrain(ledgerQuery, MAX_PAGES, satisfied)
  const purchasesDrain = useDrain(purchasesQuery, MAX_PAGES, satisfied)

  const { refetch: refetchLedger } = ledgerQuery
  const { refetch: refetchPurchases } = purchasesQuery
  const reload = useCallback(async () => {
    await Promise.all([refetchLedger(), refetchPurchases()])
  }, [refetchLedger, refetchPurchases])

  return {
    transactions,
    purchases,
    isComplete: !ledgerDrain.reachedCap && !purchasesDrain.reachedCap,
    isWindowCovered: coversSince(transactions, isLedgerExhausted, windowStart),
    isLoading: ledgerQuery.isPending || purchasesQuery.isPending,
    isDraining:
      ledgerQuery.isFetchingNextPage || purchasesQuery.isFetchingNextPage,
    // History already on screen survives a failed background refresh.
    error:
      (ledgerQuery.isError && ledgerQuery.data === undefined) ||
      (purchasesQuery.isError && purchasesQuery.data === undefined),
    reload,
  }
}
