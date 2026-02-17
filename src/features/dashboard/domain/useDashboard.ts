'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
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

export function useDashboard(): DashboardSkinProps {
  const t = useTranslations('dashboard')
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

  const statusFilters = useMemo<ReadonlyArray<StatusFilterOption>>(
    () => [
      { id: 'all', label: t('filters.status.all') },
      { id: 'pending', label: t('filters.status.pending') },
      { id: 'sent', label: t('filters.status.sent') },
      { id: 'confirmed', label: t('filters.status.confirmed') },
      { id: 'canceled', label: t('filters.status.canceled') },
    ],
    [t]
  )

  const dateRangeOptions = useMemo<ReadonlyArray<DateRangeFilterOption>>(
    () => [
      { id: 'today', label: t('filters.dateRange.today') },
      { id: 'last_7_days', label: t('filters.dateRange.last_7_days') },
      { id: 'last_30_days', label: t('filters.dateRange.last_30_days') },
    ],
    [t]
  )

  const emptyVerificationsMessage = useMemo(() => {
    if (statusFilter === 'all') {
      return t('emptyState.all')
    }
    return t('emptyState.filtered')
  }, [statusFilter, t])

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
    dateRangeOptions,
    onDateRangeFilterChange,

    verifications,
    isVerificationsLoading,
    hasVerifications,
    emptyVerificationsMessage,

    statusFilter,
    statusFilters,
    onStatusFilterChange,

    error,
  }
}
