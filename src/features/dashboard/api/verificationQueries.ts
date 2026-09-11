import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/lib/auth'
import { queryKeys } from '@/shared/query/keys'
import { buildVerificationsQuery } from '../domain/verificationFilters'
import type {
  DashboardStatsDateRange,
  DashboardStatsResponse,
  VerificationsResponse,
  VerificationStatusFilter,
} from '../model/dashboard.model'

export function verificationListInfiniteOptions(
  statusFilter: VerificationStatusFilter,
  dateRange: DashboardStatsDateRange
) {
  const query = buildVerificationsQuery(statusFilter, dateRange)

  return infiniteQueryOptions({
    queryKey: queryKeys.verifications.list({ status: statusFilter, dateRange }),
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
