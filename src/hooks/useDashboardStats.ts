'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/auth'
import type {
  DashboardStats,
  DashboardStatsDateRange,
  DashboardStatsResponse,
} from '@/types/dashboard.model'

interface DashboardStatsState {
  stats: DashboardStats | null
  isStatsLoading: boolean
  statsError: string | null
}

const INITIAL_STATE: DashboardStatsState = {
  stats: null,
  isStatsLoading: true,
  statsError: null,
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

export function useDashboardStats(dateRange: DashboardStatsDateRange) {
  const [state, setState] = useState<DashboardStatsState>(INITIAL_STATE)

  const statsQuery = `?date_range=${encodeURIComponent(dateRange)}`

  useEffect(() => {
    const controller = new AbortController()

    setState((prev) => ({
      ...prev,
      isStatsLoading: true,
      statsError: null,
    }))

    api
      .get<DashboardStatsResponse>(`/api/verifications/stats${statsQuery}`)
      .then((response) => {
        if (controller.signal.aborted) return
        setState((prev) => ({
          ...prev,
          stats: response.stats,
          isStatsLoading: false,
        }))
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState((prev) => ({
          ...prev,
          statsError: getErrorMessage(
            error,
            'Failed to load dashboard metrics'
          ),
          isStatsLoading: false,
        }))
      })

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsQuery])

  return {
    stats: state.stats,
    isStatsLoading: state.isStatsLoading,
    statsError: state.statsError,
  }
}
