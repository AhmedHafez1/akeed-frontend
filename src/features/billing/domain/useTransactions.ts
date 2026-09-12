'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import {
  DRAIN_PAGE_SIZE,
  ledgerInfiniteOptions,
  purchasesInfiniteOptions,
} from '../api/billingQueries'
import type { PagedResponse } from './billing.types'
import {
  buildTransactions,
  coversCurrentMonth,
  type Transaction,
} from './transactions'

/**
 * How many 100-row pages to pull before handing control back to the merchant.
 *
 * Filtering, search and paging all happen in the browser, so they are only
 * honest over data that has actually been fetched. Draining to 1,000 entries
 * covers every real account we have seen; past that the UI says so and offers
 * to keep going rather than quietly filtering a window.
 */
const PAGES_PER_BATCH = 10

/**
 * How far back a caller needs to read.
 *
 * `month` is for the billing page, which only shows the five newest movements
 * and the current month's usage total — draining an active tenant's whole
 * ledger for that would cost ten round trips on every visit. `full` is for the
 * operations log, where the filters really do span the account.
 */
export type TransactionScope = 'month' | 'full'

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
  /** False while more pages exist beyond the drain cap. */
  isComplete: boolean
  isLoading: boolean
  isDraining: boolean
  error: boolean
  loadMore: () => void
  reload: () => Promise<void>
}

export function useTransactions(
  scope: TransactionScope = 'full'
): UseTransactionsResult {
  const [cap, setCap] = useState(PAGES_PER_BATCH)

  const ledgerQuery = useInfiniteQuery(ledgerInfiniteOptions(DRAIN_PAGE_SIZE))
  const purchasesQuery = useInfiniteQuery(
    purchasesInfiniteOptions(DRAIN_PAGE_SIZE)
  )

  const transactions = useMemo(
    () =>
      buildTransactions(
        ledgerQuery.data?.pages.flatMap((page) => page.items) ?? [],
        purchasesQuery.data?.pages.flatMap((page) => page.items) ?? []
      ),
    [ledgerQuery.data, purchasesQuery.data]
  )

  /*
   * Both feeds arrive newest-first, so once the oldest loaded row predates the
   * 1st there is nothing left in this month to find and the walk can stop.
   */
  const satisfied = scope === 'month' && coversCurrentMonth(transactions, false)

  const ledgerDrain = useDrain(ledgerQuery, cap, satisfied)
  const purchasesDrain = useDrain(purchasesQuery, cap, satisfied)

  const { refetch: refetchLedger } = ledgerQuery
  const { refetch: refetchPurchases } = purchasesQuery
  const reload = useCallback(async () => {
    await Promise.all([refetchLedger(), refetchPurchases()])
  }, [refetchLedger, refetchPurchases])

  const loadMore = useCallback(
    () => setCap((current) => current + PAGES_PER_BATCH),
    []
  )

  return {
    transactions,
    isComplete: !ledgerDrain.reachedCap && !purchasesDrain.reachedCap,
    isLoading: ledgerQuery.isPending || purchasesQuery.isPending,
    isDraining:
      ledgerQuery.isFetchingNextPage || purchasesQuery.isFetchingNextPage,
    // History already on screen survives a failed background refresh.
    error:
      (ledgerQuery.isError && ledgerQuery.data === undefined) ||
      (purchasesQuery.isError && purchasesQuery.data === undefined),
    loadMore,
    reload,
  }
}
