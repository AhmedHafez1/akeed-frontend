'use client'

import { useQuery } from '@tanstack/react-query'
import { verificationOverviewOptions } from '../api/verificationQueries'
import type { DashboardStatsDateRange } from '../model/dashboard.model'

const AWAITING_POLL_INTERVAL_MS = 30_000

/**
 * The embedded dashboard's numbers, from the one aggregate endpoint.
 *
 * Replies arrive by webhook, so while anything is still waiting on a customer
 * the dashboard re-reads every 30 seconds; a settled period is left alone.
 */
export function useEmbeddedOverview(dateRange: DashboardStatsDateRange) {
  const query = useQuery({
    ...verificationOverviewOptions(dateRange),
    refetchInterval: (current) => {
      const funnel = current.state.data?.overview.funnel
      return funnel && funnel.no_reply_yet > 0
        ? AWAITING_POLL_INTERVAL_MS
        : false
    },
  })

  return {
    overview: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError && !query.data,
    retry: () => void query.refetch(),
  }
}
