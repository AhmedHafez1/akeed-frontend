'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/shared/lib/auth'
import { useDashboardData } from '../hooks/useDashboardData'
import type {
  DashboardStatsDateRange,
  VerificationStatusFilter,
} from '../model/dashboard.model'
import type {
  DateRangeFilterOption,
  StatusFilterOption,
  TestFeedback,
} from './dashboard.types'

interface SendTestVerificationResponse {
  success: boolean
  skipped?: boolean
  reason?: string
}

interface CancelOrderResponse {
  success: true
  verificationId: string
  status: 'canceled'
  alreadyCanceled?: boolean
  shopifyJobId?: string
}

export function useMainConfirmationsTab() {
  const t = useTranslations('dashboard')
  const [statusFilter, setStatusFilter] =
    useState<VerificationStatusFilter>('all')
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DashboardStatsDateRange>('last_30_days')
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
    error,
    pageContext,
  } = useDashboardData(statusFilter, dateRangeFilter)

  const statusFilters = useMemo<ReadonlyArray<StatusFilterOption>>(
    () => [
      { id: 'all', label: t('filters.status.all') },
      {
        id: 'awaiting_response',
        label: t('filters.status.awaiting_response'),
      },
      { id: 'confirmed', label: t('filters.status.confirmed') },
      { id: 'canceled', label: t('filters.status.canceled') },
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
      if (cancelingVerificationId) return

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
      } catch (err) {
        console.error('[Dashboard] Failed to cancel Shopify order:', err)
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
    [cancelingVerificationId, refetchVerifications, t]
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
      } catch (err) {
        console.error('[Dashboard] Failed to send test verification:', err)
        const backendMessage = err instanceof Error ? err.message : undefined
        setTestFeedback({
          tone: 'critical',
          message: backendMessage ?? t('emptyState.onboarding.testFailed'),
        })
      } finally {
        setIsSendingTest(false)
      }
    },
    [t, refetchVerifications]
  )

  const emptyVerificationsMessage =
    statusFilter === 'all' ? t('emptyState.all') : t('emptyState.filtered')

  return {
    dateRangeFilter,
    dateRangeOptions,
    onDateRangeFilterChange: setDateRangeFilter,
    isAutoVerifyEnabled:
      pageContext?.automation.is_auto_verify_enabled ?? false,
    followUpEnabled: pageContext?.automation.follow_up_enabled ?? false,
    quietHoursEnabled: pageContext?.automation.quiet_hours_enabled ?? false,
    verifications,
    isVerificationsLoading,
    hasMoreVerifications,
    isLoadingMoreVerifications,
    onLoadMoreVerifications,
    hasVerifications: verifications.length > 0,
    emptyVerificationsMessage,
    cancelingVerificationId,
    confirmingCancelVerificationId,
    cancelOrderErrors,
    onRequestCancelOrder,
    onDismissCancelOrder,
    onConfirmCancelOrder,
    statusFilter,
    statusFilters,
    onStatusFilterChange: setStatusFilter,
    isSendingTest,
    testFeedback,
    onSendTestVerification,
    onDismissTestFeedback,
    error,
  }
}
