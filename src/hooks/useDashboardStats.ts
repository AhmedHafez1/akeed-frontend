'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const statsQuery = useMemo(
    () => `?date_range=${encodeURIComponent(dateRange)}`,
    [dateRange]
  )

  const fetchStats = useCallback(async (query: string) => {
    setState((prev) => ({
      ...prev,
      isStatsLoading: true,
      statsError: null,
    }))

    try {
      const response = await api.get<DashboardStatsResponse>(
        `/api/verifications/stats${query}`
      )

      setState((prev) => ({
        ...prev,
        stats: response.stats,
        isStatsLoading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        statsError: getErrorMessage(error, 'Failed to load dashboard metrics'),
        isStatsLoading: false,
      }))
    }
  }, [])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!isActive) return
      await fetchStats(statsQuery)
    }

    void load()

    return () => {
      isActive = false
    }
  }, [fetchStats, statsQuery])

  return {
    stats: state.stats,
    isStatsLoading: state.isStatsLoading,
    statsError: state.statsError,
  }
}
