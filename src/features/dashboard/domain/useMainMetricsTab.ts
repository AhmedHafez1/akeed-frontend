'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useDashboardStats } from '../hooks/useDashboardStats'
import type { DashboardStatsDateRange } from '../model/dashboard.model'
import type { DateRangeFilterOption } from './dashboard.types'

export function useMainMetricsTab() {
  const t = useTranslations('dashboard')
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DashboardStatsDateRange>('last_30_days')

  const dateRangeOptions = useMemo<ReadonlyArray<DateRangeFilterOption>>(
    () => [
      { id: 'today', label: t('filters.dateRange.today') },
      { id: 'last_7_days', label: t('filters.dateRange.last_7_days') },
      { id: 'last_30_days', label: t('filters.dateRange.last_30_days') },
      {
        id: 'last_3_months',
        label: t('filters.dateRange.last_3_months'),
      },
    ],
    [t]
  )

  const { stats, isStatsLoading, statsError } =
    useDashboardStats(dateRangeFilter)

  return {
    stats,
    isStatsLoading,
    isAutoVerifyEnabled: stats?.automation?.is_auto_verify_enabled ?? false,
    followUpEnabled: stats?.automation?.follow_up_enabled ?? false,
    quietHoursEnabled: stats?.automation?.quiet_hours_enabled ?? false,
    dateRangeFilter,
    dateRangeOptions,
    onDateRangeFilterChange: setDateRangeFilter,
    error: statsError,
  }
}
