'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/shared/lib/auth'
import { useDashboardData } from '../hooks/useDashboardData'
import { useDashboardStats } from '../hooks/useDashboardStats'
import type {
  DashboardStatsDateRange,
  VerificationStatusFilter,
} from '../model/dashboard.model'
import type {
  DashboardSkinProps,
  DateRangeFilterOption,
  StatusFilterOption,
  TestFeedback,
} from './dashboard.types'

interface SendTestVerificationResponse {
  success: boolean
  skipped?: boolean
  reason?: string
}

export function useDashboard(): DashboardSkinProps {
  const t = useTranslations('dashboard')
  const [statusFilter, setStatusFilter] =
    useState<VerificationStatusFilter>('all')
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DashboardStatsDateRange>('last_30_days')

  // Test verification state
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testFeedback, setTestFeedback] = useState<TestFeedback | null>(null)

  const {
    verifications,
    isVerificationsLoading,
    hasMoreVerifications,
    isLoadingMoreVerifications,
    onLoadMoreVerifications,
    refetch: refetchVerifications,
    error: verificationsError,
  } = useDashboardData(statusFilter, dateRangeFilter)

  const {
    stats,
    isStatsLoading,
    statsError,
    refetch: refetchStats,
  } = useDashboardStats(dateRangeFilter)

  const hasVerifications = verifications?.length > 0

  const statusFilters = useMemo<ReadonlyArray<StatusFilterOption>>(
    () => [
      { id: 'all', label: t('filters.status.all') },
      {
        id: 'awaiting_response',
        label: t('filters.status.awaiting_response'),
      },
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
      {
        id: 'last_3_months',
        label: t('filters.dateRange.last_3_months'),
      },
    ],
    [t]
  )

  // Simple conditional — not complex enough for useMemo
  const emptyVerificationsMessage =
    statusFilter === 'all' ? t('emptyState.all') : t('emptyState.filtered')

  // Stable setters from useState are already referentially stable.
  // Wrapping them in useCallback adds overhead without benefit.
  const onStatusFilterChange = setStatusFilter
  const onDateRangeFilterChange = setDateRangeFilter

  const onDismissTestFeedback = useCallback(() => {
    setTestFeedback(null)
  }, [])

  const onSendTestVerification = useCallback(
    async (customerPhone: string) => {
      const normalizedPhone = customerPhone.trim()
      if (!normalizedPhone) {
        setTestFeedback({
          tone: 'critical',
          message: t('emptyState.onboarding.testPhoneRequired'),
        })
        return
      }

      setIsSendingTest(true)
      setTestFeedback(null)

      try {
        const response = await api.post<SendTestVerificationResponse>(
          '/api/verifications/test',
          { customerPhone: normalizedPhone }
        )

        if (response.skipped) {
          setTestFeedback({
            tone: 'warning',
            message: response.reason ?? t('emptyState.onboarding.testSkipped'),
          })
          return
        }

        setTestFeedback({
          tone: 'success',
          message: t('emptyState.onboarding.testSent'),
        })

        refetchVerifications()
        refetchStats()
      } catch (error) {
        console.error('[Dashboard] Failed to send test verification:', error)
        const backendMessage =
          error instanceof Error ? error.message : undefined
        setTestFeedback({
          tone: 'critical',
          message: backendMessage ?? t('emptyState.onboarding.testFailed'),
        })
      } finally {
        setIsSendingTest(false)
      }
    },
    [t, refetchVerifications, refetchStats]
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
    hasMoreVerifications,
    isLoadingMoreVerifications,
    onLoadMoreVerifications,
    hasVerifications,
    emptyVerificationsMessage,

    statusFilter,
    statusFilters,
    onStatusFilterChange,

    isSendingTest,
    testFeedback,
    onSendTestVerification,
    onDismissTestFeedback,

    error,
  }
}
