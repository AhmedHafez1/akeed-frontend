'use client'

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { verificationStatsOptions } from '../api/verificationQueries'
import type { DashboardStatsDateRange } from '../model/dashboard.model'

const IN_PROGRESS_POLL_INTERVAL_MS = 30_000

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

export function useDashboardStats(dateRange: DashboardStatsDateRange) {
  const {
    data: stats,
    dataUpdatedAt,
    error,
    isPending,
    refetch: refetchQuery,
  } = useQuery({
    ...verificationStatsOptions(dateRange),
    // Counts move with the rows: while any verification is still in progress
    // the totals can change without the merchant doing anything.
    refetchInterval: (current) =>
      (current.state.data?.stats.totals.in_progress ?? 0) > 0
        ? IN_PROGRESS_POLL_INTERVAL_MS
        : false,
  })

  const refetch = useCallback(() => {
    void refetchQuery()
  }, [refetchQuery])

  return {
    stats: stats ?? null,
    isStatsLoading: isPending,
    statsError: error
      ? getErrorMessage(error, 'Failed to load dashboard metrics')
      : null,
    refetch,
    /** When the totals were last fetched; lets optimistic counts hand over. */
    statsUpdatedAt: dataUpdatedAt,
  }
}
