import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import { BATCH_POLL_INTERVAL_MS, isTransitional } from '../domain/importStep'
import {
  getOrderImport,
  getOrderImportRows,
  isOrderImportApiError,
  listOpenOrderImportDrafts,
  type OrderImportRowOutcome,
} from './orderImportsApi'

/** A missing or disabled import will not appear by retrying. */
function retryUnlessRefused(failureCount: number, error: Error): boolean {
  if (isOrderImportApiError(error) && error.status < 500) return false
  return failureCount < 2
}

export function openDraftsOptions() {
  return queryOptions({
    queryKey: queryKeys.orderImports.list(),
    queryFn: ({ signal }) => listOpenOrderImportDrafts(signal),
    retry: retryUnlessRefused,
  })
}

export function orderImportDetailOptions(batchId: string) {
  return queryOptions({
    queryKey: queryKeys.orderImports.detail(batchId),
    queryFn: ({ signal }) => getOrderImport(batchId, signal),
    retry: retryUnlessRefused,
    // Only statuses the server moves on its own are polled; a draft waits
    // for the merchant.
    refetchInterval: (query) =>
      query.state.data && isTransitional(query.state.data.status)
        ? BATCH_POLL_INTERVAL_MS
        : false,
  })
}

export function orderImportRowsOptions(
  batchId: string,
  outcome: OrderImportRowOutcome
) {
  return infiniteQueryOptions({
    queryKey: queryKeys.orderImports.rows(batchId, outcome),
    queryFn: ({ pageParam, signal }) =>
      getOrderImportRows(batchId, { outcome, cursor: pageParam }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    retry: retryUnlessRefused,
  })
}
