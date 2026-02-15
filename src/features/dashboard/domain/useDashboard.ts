'use client'

import { useCallback, useMemo, useState } from 'react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import type {
  DashboardStatsDateRange,
  VerificationStatusFilter,
} from '@/types/dashboard.model'
import type {
  DashboardSkinProps,
  DateRangeFilterOption,
  StatusFilterOption,
} from './dashboard.types'

const STATUS_FILTERS: ReadonlyArray<StatusFilterOption> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'sent', label: 'Sent' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'canceled', label: 'Canceled' },
] as const

const DATE_RANGE_FILTERS: ReadonlyArray<DateRangeFilterOption> = [
  { id: 'today', label: 'Today' },
  { id: 'last_7_days', label: 'Last 7 days' },
  { id: 'last_30_days', label: 'Last 30 days' },
] as const

export function useDashboard(): DashboardSkinProps {
  const [statusFilter, setStatusFilter] =
    useState<VerificationStatusFilter>('all')
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DashboardStatsDateRange>('last_30_days')

  const {
    verifications,
    isVerificationsLoading,
    error: verificationsError,
  } = useDashboardData(statusFilter)

  const { stats, isStatsLoading, statsError } = useDashboardStats(dateRangeFilter)

  const hasVerifications = verifications.length > 0

  const emptyVerificationsMessage = useMemo(() => {
    if (statusFilter === 'all') {
      return 'No verifications yet. Once an order is received, verification requests will appear here.'
    }
    return 'No verifications match the selected status.'
  }, [statusFilter])

  const onStatusFilterChange = useCallback((filter: VerificationStatusFilter) => {
    setStatusFilter(filter)
  }, [])

  const onDateRangeFilterChange = useCallback(
    (filter: DashboardStatsDateRange) => {
      setDateRangeFilter(filter)
    },
    []
  )

  const error = useMemo(() => {
    if (verificationsError && statsError) {
      return `${verificationsError}. ${statsError}.`
    }

    return verificationsError ?? statsError
  }, [statsError, verificationsError])

  return {
    stats,
    isStatsLoading,
    dateRangeFilter,
    dateRangeOptions: DATE_RANGE_FILTERS,
    onDateRangeFilterChange,

    verifications,
    isVerificationsLoading,
    hasVerifications,
    emptyVerificationsMessage,

    statusFilter,
    statusFilters: STATUS_FILTERS,
    onStatusFilterChange,

    error,
  }
}
