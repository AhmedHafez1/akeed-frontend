'use client'

import { useDashboardStats } from '../hooks/useDashboardStats'
import type { DashboardStatsDateRange } from '../model/dashboard.model'

export function useMainMetricsTab(dateRangeFilter: DashboardStatsDateRange) {
  const { stats, isStatsLoading, statsError } =
    useDashboardStats(dateRangeFilter)

  return {
    stats,
    isStatsLoading,
    isAutoVerifyEnabled: stats?.automation?.is_auto_verify_enabled ?? false,
    followUpEnabled: stats?.automation?.follow_up_enabled ?? false,
    quietHoursEnabled: stats?.automation?.quiet_hours_enabled ?? false,
    error: statsError,
  }
}
