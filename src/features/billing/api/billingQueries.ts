import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import { fetchCreditSummary, fetchLedger, fetchPurchases } from './billingApi'

/** The server caps `limit` at 100; the operations log drains at that size. */
export const DRAIN_PAGE_SIZE = 100

export function creditSummaryOptions() {
  return queryOptions({
    queryKey: queryKeys.billing.summary(),
    queryFn: ({ signal }) => fetchCreditSummary(signal),
  })
}

export function ledgerInfiniteOptions(limit = 25) {
  return infiniteQueryOptions({
    queryKey: queryKeys.billing.ledger(limit),
    queryFn: ({ pageParam, signal }) =>
      fetchLedger(pageParam ?? undefined, signal, limit),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

export function purchasesInfiniteOptions(limit = 25) {
  return infiniteQueryOptions({
    queryKey: queryKeys.billing.purchases(limit),
    queryFn: ({ pageParam, signal }) =>
      fetchPurchases(pageParam ?? undefined, signal, limit),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
