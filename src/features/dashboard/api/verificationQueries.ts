import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'
import { buildVerificationsQuery } from '../domain/verificationFilters'
import type {
  ConfirmationsTab,
  DashboardOverviewResponse,
  DashboardStatsDateRange,
  DashboardStatsResponse,
  VerificationsResponse,
  VerificationStatusFilter,
} from '../model/dashboard.model'

export function verificationListInfiniteOptions(
  statusFilter: VerificationStatusFilter,
  dateRange: DashboardStatsDateRange,
  importBatchId?: string
) {
  const query = buildVerificationsQuery({
    statusFilter,
    dateRange,
    importBatchId,
  })

  return infiniteQueryOptions({
    // The batch belongs in the key: two filters must not share a cache
    // entry, or clearing the chip would show the filtered page.
    queryKey: queryKeys.verifications.list({
      status: statusFilter,
      dateRange,
      importBatchId,
    }),
    queryFn: ({ pageParam, signal }) =>
      api.get<VerificationsResponse>(
        pageParam
          ? `/api/verifications${query}&cursor=${encodeURIComponent(pageParam)}`
          : `/api/verifications${query}`,
        { signal }
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    // Outcomes arrive by WhatsApp webhook, not from this tab, so returning to
    // the tab always re-reads rather than trusting a still-fresh cache.
    refetchOnWindowFocus: 'always',
  })
}

export function verificationStatsOptions(dateRange: DashboardStatsDateRange) {
  return queryOptions({
    queryKey: queryKeys.verifications.stats(dateRange),
    queryFn: ({ signal }) =>
      api.get<DashboardStatsResponse>(
        `/api/verifications/stats?date_range=${encodeURIComponent(dateRange)}`,
        { signal }
      ),
    select: (response) => response.stats,
    refetchOnWindowFocus: 'always',
  })
}

/** Rows per page of the embedded confirmations table. */
export const CONFIRMATIONS_PAGE_SIZE = 20

export interface ConfirmationsPageParams {
  tab: ConfirmationsTab
  dateRange: DashboardStatsDateRange
  search: string
  cursor: string | null
}

/**
 * One page of the embedded confirmations table: tab, search and paging are
 * all answered by the server, and the previous page stays on screen while the
 * next one loads.
 */
export function confirmationsPageOptions({
  tab,
  dateRange,
  search,
  cursor,
}: ConfirmationsPageParams) {
  const params = new URLSearchParams({
    date_range: dateRange,
    limit: String(CONFIRMATIONS_PAGE_SIZE),
  })
  if (tab !== 'all') params.set('tab', tab)
  if (search) params.set('q', search)
  if (cursor) params.set('cursor', cursor)

  return queryOptions({
    queryKey: queryKeys.verifications.list({
      status: `tab:${tab}`,
      dateRange,
      search,
      cursor,
    }),
    queryFn: ({ signal }) =>
      api.get<VerificationsResponse>(`/api/verifications?${params}`, {
        signal,
      }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: 'always',
  })
}

/** Everything the embedded dashboard shows, from one request. */
export function verificationOverviewOptions(
  dateRange: DashboardStatsDateRange
) {
  return queryOptions({
    queryKey: queryKeys.verifications.overview(dateRange),
    queryFn: ({ signal }) =>
      api.get<DashboardOverviewResponse>(
        `/api/verifications/overview?date_range=${encodeURIComponent(dateRange)}`,
        { signal }
      ),
    select: (response) => response.overview,
    refetchOnWindowFocus: 'always',
  })
}
