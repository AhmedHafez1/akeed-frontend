'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/shared/lib/auth'
import type {
  DashboardStatsDateRange,
  StandaloneDashboardStats,
  StandaloneDashboardStatsResponse,
} from '../model/dashboard.model'

export function useStandaloneDashboardStats(
  dateRange: DashboardStatsDateRange,
  fallbackError: string
) {
  const [stats, setStats] = useState<StandaloneDashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null)
  const [refetchKey, setRefetchKey] = useState(0)
  const query = `?date_range=${encodeURIComponent(dateRange)}`

  useEffect(() => {
    const controller = new AbortController()
    api
      .get<StandaloneDashboardStatsResponse>(`/api/orders/stats${query}`)
      .then((response) => {
        if (controller.signal.aborted) return
        setStats(response.stats)
        setError(null)
        setResolvedQuery(query)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setError(fallbackError)
        setResolvedQuery(query)
      })
    return () => controller.abort()
  }, [fallbackError, query, refetchKey])

  return {
    stats,
    error: resolvedQuery === query ? error : null,
    isLoading: resolvedQuery !== query,
    refetch: useCallback(() => setRefetchKey((key) => key + 1), []),
  }
}
