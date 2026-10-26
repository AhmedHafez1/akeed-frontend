'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { verificationOverviewOptions } from '../api/verificationQueries'
import type { DashboardStatsDateRange } from '../model/dashboard.model'
import { toMessageUsageView } from '../model/messageUsage.model'

/**
 * The message allowance for the header, on both main tabs. It reads the
 * overview's cache entry, so it shows the same numbers as the dashboard, and
 * the dashboard's polling keeps it fresh. A period switch keeps the last
 * known count on screen: the allowance does not depend on the period.
 */
export function useMessageUsage(
  dateRange: DashboardStatsDateRange,
  billingPlanId: string | null | undefined
) {
  const query = useQuery({
    ...verificationOverviewOptions(dateRange),
    placeholderData: keepPreviousData,
  })

  return {
    view: toMessageUsageView({
      // An older payload without usage is unavailable, not loading.
      usage: query.data ? (query.data.usage ?? null) : undefined,
      isPending: query.isPending,
      isError: query.isError,
      billingPlanId,
    }),
    isRefreshing: query.isFetching,
    retry: () => void query.refetch(),
  }
}
