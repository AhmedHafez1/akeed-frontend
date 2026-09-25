import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'
import { pollIntervalFor } from '../domain/importStep'
import { MAX_IMPORT_ROWS } from '../domain/preCheck'
import {
  getOrderImport,
  getOrderImportRows,
  getOrderImportStartQuote,
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
    refetchInterval: (query) =>
      query.state.data ? pollIntervalFor(query.state.data) : false,
  })
}

/**
 * The start quote is only ever read fresh: it prices the balance of this
 * moment, and its token expires after 10 minutes.
 */
export function orderImportStartQuoteOptions(batchId: string) {
  return queryOptions({
    queryKey: queryKeys.orderImports.startQuote(batchId),
    queryFn: ({ signal }) => getOrderImportStartQuote(batchId, signal),
    retry: retryUnlessRefused,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
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

/**
 * Every row of the batch in one page: a file holds at most 100 orders, the
 * page size ceiling. The send step previews the ready rows and groups the
 * rest by reason from it. Including a row re-reads it (the `all` key is not
 * the toggled outcome's).
 */
export function orderImportAllRowsOptions(batchId: string) {
  return queryOptions({
    queryKey: queryKeys.orderImports.rows(batchId, 'all'),
    queryFn: ({ signal }) =>
      getOrderImportRows(batchId, { limit: MAX_IMPORT_ROWS }, signal),
    retry: retryUnlessRefused,
  })
}
