'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { CancelOrderResponse } from '@/shared/types/commerce-outcome.model'
import { canCancelOrder } from './cancellation'
import { api } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
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

const logger = createLogger('Dashboard')

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
  const [confirmingCancelVerificationId, setConfirmingCancelVerificationId] =
    useState<string | null>(null)
  const [cancelingVerificationId, setCancelingVerificationId] = useState<
    string | null
  >(null)
  const [cancelOrderErrors, setCancelOrderErrors] = useState<
    Record<string, string>
  >({})

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
  const isAutoVerifyEnabled = stats?.automation?.is_auto_verify_enabled ?? false
  const followUpEnabled = stats?.automation?.follow_up_enabled ?? false
  const quietHoursEnabled = stats?.automation?.quiet_hours_enabled ?? false

  const hasVerifications = verifications?.length > 0

  const statusFilters = useMemo<ReadonlyArray<StatusFilterOption>>(
    () => [
      { id: 'all', label: t('filters.status.all') },
      { id: 'pending', label: t('filters.status.pending') },
      {
        id: 'awaiting_response',
        label: t('filters.status.awaiting_response'),
      },
      { id: 'confirmed', label: t('filters.status.confirmed') },
      { id: 'canceled', label: t('filters.status.canceled') },
      { id: 'failed', label: t('filters.status.failed') },
      { id: 'no_reply', label: t('filters.status.no_reply') },
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

  const onRequestCancelOrder = useCallback((verificationId: string) => {
    setConfirmingCancelVerificationId(verificationId)
    setCancelOrderErrors((previous) => {
      const next = { ...previous }
      delete next[verificationId]
      return next
    })
  }, [])

  const onDismissCancelOrder = useCallback((verificationId: string) => {
    setConfirmingCancelVerificationId((current) =>
      current === verificationId ? null : current
    )
    setCancelOrderErrors((previous) => {
      const next = { ...previous }
      delete next[verificationId]
      return next
    })
  }, [])

  const onConfirmCancelOrder = useCallback(
    async (verificationId: string) => {
      if (cancelingVerificationId) {
        return
      }

      const verification = verifications.find(
        (item) => item.id === verificationId
      )
      if (!verification || !canCancelOrder(verification)) return
      setCancelingVerificationId(verificationId)
      setCancelOrderErrors((previous) => {
        const next = { ...previous }
        delete next[verificationId]
        return next
      })

      try {
        await api.post<CancelOrderResponse>(
          `/api/verifications/${verificationId}/cancel`
        )
        setConfirmingCancelVerificationId((current) =>
          current === verificationId ? null : current
        )
        refetchVerifications()
        refetchStats()
      } catch (error) {
        logger.error('Failed to cancel order', error)
        setCancelOrderErrors((previous) => ({
          ...previous,
          [verificationId]: t('table.actions.cancelOrderError'),
        }))
      } finally {
        setCancelingVerificationId((current) =>
          current === verificationId ? null : current
        )
      }
    },
    [
      cancelingVerificationId,
      refetchStats,
      refetchVerifications,
      t,
      verifications,
    ]
  )

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
        logger.error('Failed to send test verification', error)
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
    isAutoVerifyEnabled,
    followUpEnabled,
    quietHoursEnabled,
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
    cancelingVerificationId,
    confirmingCancelVerificationId,
    cancelOrderErrors,
    onRequestCancelOrder,
    onDismissCancelOrder,
    onConfirmCancelOrder,

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
