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

/** Rows fetched per request by the confirmations table, in both modes. */
export const CONFIRMATIONS_PAGE_SIZE = 30

export interface ConfirmationsListParams {
  tab: ConfirmationsTab
  dateRange: DashboardStatsDateRange
  search: string
  /** Narrows the list to the orders one import batch created. */
  importBatchId?: string
}

/**
 * The confirmations table as one growing list: tab and search are answered by
 * the server, and each further page is fetched with the previous page's
 * cursor as the merchant scrolls.
 */
export function confirmationsListOptions({
  tab,
  dateRange,
  search,
  importBatchId,
}: ConfirmationsListParams) {
  const params = new URLSearchParams({
    date_range: dateRange,
    limit: String(CONFIRMATIONS_PAGE_SIZE),
  })
  if (tab !== 'all') params.set('tab', tab)
  if (search) params.set('q', search)
  if (importBatchId) params.set('importBatchId', importBatchId)

  return infiniteQueryOptions({
    queryKey: queryKeys.verifications.list({
      status: `tab:${tab}`,
      dateRange,
      search,
      importBatchId,
      infinite: true,
    }),
    queryFn: ({ pageParam, signal }) => {
      const page = new URLSearchParams(params)
      if (pageParam) page.set('cursor', pageParam)
      return api.get<VerificationsResponse>(`/api/verifications?${page}`, {
        signal,
      })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: 'always',
  })
}

/** Everything the dashboard overview shows, from one request. */
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
