import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import { fetchCreditSummary, fetchLedger, fetchPurchases } from './billingApi'

export function creditSummaryOptions() {
  return queryOptions({
    queryKey: queryKeys.billing.summary(),
    queryFn: ({ signal }) => fetchCreditSummary(signal),
  })
}

export function ledgerInfiniteOptions() {
  return infiniteQueryOptions({
    queryKey: queryKeys.billing.ledger(),
    queryFn: ({ pageParam, signal }) =>
      fetchLedger(pageParam ?? undefined, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

export function purchasesInfiniteOptions() {
  return infiniteQueryOptions({
    queryKey: queryKeys.billing.purchases(),
    queryFn: ({ pageParam, signal }) =>
      fetchPurchases(pageParam ?? undefined, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
