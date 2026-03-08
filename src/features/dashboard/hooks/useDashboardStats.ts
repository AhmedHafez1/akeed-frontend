'use client'

import { useEffect, useState } from 'react'
import { api } from '@/shared/lib/auth'
import type {
  DashboardStats,
  DashboardStatsDateRange,
  DashboardStatsResponse,
} from '../model/dashboard.model'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

export function useDashboardStats(dateRange: DashboardStatsDateRange) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null)

  const statsQuery = `?date_range=${encodeURIComponent(dateRange)}`

  useEffect(() => {
    const controller = new AbortController()

    api
      .get<DashboardStatsResponse>(`/api/verifications/stats${statsQuery}`)
      .then((response) => {
        if (controller.signal.aborted) return
        setStats(response.stats)
        setStatsError(null)
        setResolvedQuery(statsQuery)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setStatsError(getErrorMessage(error, 'Failed to load dashboard metrics'))
        setResolvedQuery(statsQuery)
      })

    return () => {
      controller.abort()
    }
  }, [statsQuery])

  const isStatsLoading = resolvedQuery !== statsQuery
  const activeError = resolvedQuery === statsQuery ? statsError : null

  return {
    stats,
    isStatsLoading,
    statsError: activeError,
  }
}
