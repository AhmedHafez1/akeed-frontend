'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { CancelOrderResponse } from '@/shared/types/commerce-outcome.model'
import { canCancelOrder } from './cancellation'
import { api } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import { useDashboardData } from '../hooks/useDashboardData'
import type {
  DashboardStatsDateRange,
  VerificationStatusFilter,
} from '../model/dashboard.model'
import type { StatusFilterOption, TestFeedback } from './dashboard.types'
import { getTestVerificationFeedbackKey } from './testVerificationFeedback'

const logger = createLogger('Dashboard')

interface SendTestVerificationResponse {
  success: boolean
  skipped?: boolean
  reason?: string
}

export function useMainConfirmationsTab(
  dateRangeFilter: DashboardStatsDateRange
) {
  const t = useTranslations('dashboard')
  const [statusFilter, setStatusFilter] =
    useState<VerificationStatusFilter>('all')
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
  const canSendTestVerification =
    pageContext?.permissions?.can_send_test_verification === true
  const canCancelOrders = pageContext?.permissions?.can_cancel_orders === true
  const canCreateManualOrder = false

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
      if (!canCancelOrders || cancelingVerificationId) return

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
      canCancelOrders,
      cancelingVerificationId,
      refetchVerifications,
      t,
      verifications,
    ]
  )

  const onSendTestVerification = useCallback(
    async (customerPhone: string) => {
      if (!canSendTestVerification) {
        setTestFeedback({
          tone: 'critical',
          message: t('emptyState.onboarding.testRoleRequired'),
        })
        return
      }
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
            message:
              response.reason === 'plan_limit_reached'
                ? t('emptyState.onboarding.testQuotaReached')
                : t('emptyState.onboarding.testSkipped'),
          })
          return
        }

        setTestFeedback({
          tone: 'success',
          message: t('emptyState.onboarding.testSent'),
        })

        refetchVerifications()
      } catch (error) {
        logger.error('Failed to send test verification', error)
        setTestFeedback({
          tone: 'critical',
          message: t(getTestVerificationFeedbackKey(error)),
        })
      } finally {
        setIsSendingTest(false)
      }
    },
    [canSendTestVerification, t, refetchVerifications]
  )

  const emptyVerificationsMessage =
    statusFilter === 'all' ? t('emptyState.all') : t('emptyState.filtered')

  return {
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
    canSendTestVerification,
    canCancelOrders,
    canCreateManualOrder,
    testFeedback,
    onSendTestVerification,
    onDismissTestFeedback,
    error,
  }
}
