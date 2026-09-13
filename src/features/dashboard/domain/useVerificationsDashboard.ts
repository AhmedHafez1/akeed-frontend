'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ApiError } from '@/shared/lib/http'
import { creditFeedbackKey } from '@/shared/lib/creditFeedback'
import { createLogger } from '@/shared/lib/logger'
import { usePendingManualOrders } from '@/features/orders'
import {
  useCancelVerificationMutation,
  useRetryVerificationMutation,
  useSendTestVerificationMutation,
} from '../api/verificationMutations'
import { useDashboardData } from '../hooks/useDashboardData'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { canCancelOrder } from './cancellation'
import {
  applyOptimisticTotals,
  mergeOptimisticRows,
} from './optimisticVerification'
import { canRetryVerification } from './verificationLifecycle'
import {
  DASHBOARD_DATE_RANGE_IDS,
  VERIFICATION_STATUS_FILTER_IDS,
} from './verificationFilters'
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
import { getTestVerificationFeedbackKey } from './testVerificationFeedback'

const logger = createLogger('Dashboard')

export interface UseVerificationsDashboardOptions {
  initialStatusFilter?: VerificationStatusFilter
  statusFilter?: VerificationStatusFilter
  onStatusFilterChange?: (filter: VerificationStatusFilter) => void
  /**
   * Lets a caller drive the date range from outside — the embedded shell shares
   * one selection between its metrics and confirmations tabs. Omitted, the hook
   * owns the state itself.
   */
  dateRangeFilter?: DashboardStatsDateRange
  onDateRangeFilterChange?: (filter: DashboardStatsDateRange) => void
}

/**
 * Everything both dashboard skins need, resolved once.
 *
 * This is the seam that keeps the two runtime modes honest: one endpoint, one
 * status vocabulary, one filter set, one definition of when an action is
 * offered. A skin decides how a row *looks*; it no longer decides what a row
 * *is*.
 */
export function useVerificationsDashboard(
  options: UseVerificationsDashboardOptions = {}
): DashboardSkinProps {
  const t = useTranslations('dashboard')
  const tCredits = useTranslations('creditErrors')
  const [ownStatusFilter, setStatusFilter] = useState<VerificationStatusFilter>(
    options.initialStatusFilter ?? 'all'
  )
  const statusFilter = options.statusFilter ?? ownStatusFilter
  const [ownDateRange, setOwnDateRange] =
    useState<DashboardStatsDateRange>('last_30_days')
  const dateRangeFilter = options.dateRangeFilter ?? ownDateRange
  const onDateRangeFilterChange =
    options.onDateRangeFilterChange ?? setOwnDateRange

  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testFeedback, setTestFeedback] = useState<TestFeedback | null>(null)
  const [actionFeedback, setActionFeedback] = useState<TestFeedback | null>(
    null
  )
  const [confirmingCancelVerificationId, setConfirmingCancelVerificationId] =
    useState<string | null>(null)
  const [actingVerificationId, setActingVerificationId] = useState<
    string | null
  >(null)
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})

  const {
    verifications,
    totalCount,
    isVerificationsLoading,
    hasMoreVerifications,
    isLoadingMoreVerifications,
    onLoadMoreVerifications,
    error: verificationsError,
    pageContext,
    verificationsUpdatedAt,
  } = useDashboardData(statusFilter, dateRangeFilter)

  const { stats, isStatsLoading, statsError, statsUpdatedAt } =
    useDashboardStats(dateRangeFilter)
  const { mutateAsync: cancelVerification } = useCancelVerificationMutation()
  const { mutateAsync: retryVerification } = useRetryVerificationMutation()
  const { mutateAsync: sendTestVerification } =
    useSendTestVerificationMutation()
  const { pendingOrders } = usePendingManualOrders()

  // What the skins render: server truth plus orders the merchant just created
  // that the server cannot list yet. Row actions keep reading `verifications`,
  // so an optimistic row can never be canceled or retried.
  const displayedVerifications = useMemo(
    () =>
      mergeOptimisticRows(
        verifications,
        verificationsUpdatedAt,
        pendingOrders,
        statusFilter
      ),
    [pendingOrders, statusFilter, verifications, verificationsUpdatedAt]
  )
  const displayedStats = useMemo(
    () => applyOptimisticTotals(stats, statsUpdatedAt, pendingOrders),
    [pendingOrders, stats, statsUpdatedAt]
  )

  const creditDenialCode = pageContext?.usage?.credit_denial ?? null
  const creditBlocked = Boolean(creditDenialCode)
  const permissions = pageContext?.permissions
  const canSendTestVerification =
    permissions?.can_send_test_verification === true && !creditBlocked
  const canCancelOrders = permissions?.can_cancel_orders === true
  const canCreateManualOrder =
    permissions?.can_create_manual_order === true && !creditBlocked
  const canRetryVerifications =
    permissions?.can_retry_verifications === true && !creditBlocked
  const usageRemaining = pageContext?.usage?.remaining ?? null
  const isAtPlanLimit =
    (pageContext?.usage?.limit ?? 0) > 0 &&
    usageRemaining !== null &&
    usageRemaining <= 0

  const statusFilters = useMemo<ReadonlyArray<StatusFilterOption>>(
    () =>
      VERIFICATION_STATUS_FILTER_IDS.map((id) => ({
        id,
        label: t(`filters.status.${id}`),
      })),
    [t]
  )

  const dateRangeOptions = useMemo<ReadonlyArray<DateRangeFilterOption>>(
    () =>
      DASHBOARD_DATE_RANGE_IDS.map((id) => ({
        id,
        label: t(`filters.dateRange.${id}`),
      })),
    [t]
  )

  const onDismissTestFeedback = useCallback(() => setTestFeedback(null), [])
  const onDismissActionFeedback = useCallback(() => setActionFeedback(null), [])

  const clearActionError = useCallback((verificationId: string) => {
    setActionErrors((current) => {
      const next = { ...current }
      delete next[verificationId]
      return next
    })
  }, [])

  const onRequestCancelOrder = useCallback(
    (verificationId: string) => {
      setConfirmingCancelVerificationId(verificationId)
      clearActionError(verificationId)
    },
    [clearActionError]
  )

  const onDismissCancelOrder = useCallback(
    (verificationId: string) => {
      setConfirmingCancelVerificationId((current) =>
        current === verificationId ? null : current
      )
      clearActionError(verificationId)
    },
    [clearActionError]
  )

  const onConfirmCancelOrder = useCallback(
    async (verificationId: string) => {
      if (!canCancelOrders || actingVerificationId) return
      const verification = verifications.find(
        (item) => item.id === verificationId
      )
      if (!verification || !canCancelOrder(verification)) return

      setActingVerificationId(verificationId)
      clearActionError(verificationId)
      setActionFeedback(null)
      try {
        await cancelVerification(verificationId)
        setConfirmingCancelVerificationId((current) =>
          current === verificationId ? null : current
        )
        setActionFeedback({
          tone: 'success',
          message: t('table.actions.cancelOrderSuccess'),
        })
      } catch (error) {
        logger.warn('Failed to cancel order', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        setActionErrors((current) => ({
          ...current,
          [verificationId]: t('table.actions.cancelOrderError'),
        }))
      } finally {
        setActingVerificationId((current) =>
          current === verificationId ? null : current
        )
      }
    },
    [
      actingVerificationId,
      canCancelOrders,
      cancelVerification,
      clearActionError,
      t,
      verifications,
    ]
  )

  const onRetryVerification = useCallback(
    async (verificationId: string) => {
      if (!canRetryVerifications || actingVerificationId) return
      const verification = verifications.find(
        (item) => item.id === verificationId
      )
      if (!verification || !canRetryVerification(verification.capabilities))
        return

      setActingVerificationId(verificationId)
      clearActionError(verificationId)
      setActionFeedback(null)
      try {
        await retryVerification(verification.order_id)
        setActionFeedback({
          tone: 'success',
          message: t('table.actions.retrySuccess'),
        })
      } catch (error) {
        logger.warn('Failed to retry verification', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        const creditKey =
          error instanceof ApiError ? creditFeedbackKey(error.code) : undefined
        const message = creditKey
          ? tCredits(creditKey)
          : t('table.actions.retryError')
        setActionErrors((current) => ({
          ...current,
          [verificationId]: message,
        }))
        setActionFeedback({
          tone: 'critical',
          message,
          billingLink: Boolean(creditKey),
        })
      } finally {
        setActingVerificationId((current) =>
          current === verificationId ? null : current
        )
      }
    },
    [
      actingVerificationId,
      canRetryVerifications,
      tCredits,
      clearActionError,
      retryVerification,
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
        const response = await sendTestVerification(normalizedPhone)
        if (response.skipped) {
          setTestFeedback({
            tone: 'warning',
            message: creditFeedbackKey(response.reason)
              ? tCredits(creditFeedbackKey(response.reason)!)
              : response.reason === 'plan_limit_reached'
                ? t('emptyState.onboarding.testQuotaReached')
                : t('emptyState.onboarding.testSkipped'),
          })
          return
        }
        setTestFeedback({
          tone: 'success',
          message: t('emptyState.onboarding.testSent'),
        })
      } catch (error) {
        logger.warn('Failed to send test verification', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        const creditKey =
          error instanceof ApiError ? creditFeedbackKey(error.code) : undefined
        setTestFeedback({
          tone: 'critical',
          message: creditKey
            ? tCredits(creditKey)
            : t(getTestVerificationFeedbackKey(error)),
          billingLink: Boolean(creditKey),
        })
      } finally {
        setIsSendingTest(false)
      }
    },
    [canSendTestVerification, sendTestVerification, t, tCredits]
  )

  const error = useMemo(() => {
    if (verificationsError && statsError) {
      return `${verificationsError} ${statsError}`
    }
    return verificationsError ?? statsError
  }, [verificationsError, statsError])

  return {
    stats: displayedStats,
    isStatsLoading,
    isAutoVerifyEnabled:
      stats?.automation.is_auto_verify_enabled ??
      pageContext?.automation.is_auto_verify_enabled ??
      false,
    followUpEnabled:
      stats?.automation.follow_up_enabled ??
      pageContext?.automation.follow_up_enabled ??
      false,
    quietHoursEnabled:
      stats?.automation.quiet_hours_enabled ??
      pageContext?.automation.quiet_hours_enabled ??
      false,
    sourceStatus:
      stats?.source?.status ?? pageContext?.source?.status ?? 'not_connected',
    reportingTimezone:
      stats?.reporting_timezone ?? pageContext?.reporting_timezone ?? 'UTC',
    dateRangeFilter,
    dateRangeOptions,
    onDateRangeFilterChange,
    verifications: displayedVerifications,
    totalCount:
      totalCount + displayedVerifications.length - verifications.length,
    isVerificationsLoading,
    hasMoreVerifications,
    isLoadingMoreVerifications,
    onLoadMoreVerifications,
    hasVerifications: displayedVerifications.length > 0,
    emptyVerificationsMessage:
      statusFilter === 'all' ? t('emptyState.all') : t('emptyState.filtered'),
    actingVerificationId,
    confirmingCancelVerificationId,
    actionErrors,
    onRequestCancelOrder,
    onDismissCancelOrder,
    onConfirmCancelOrder,
    onRetryVerification,
    statusFilter,
    statusFilters,
    onStatusFilterChange: options.onStatusFilterChange ?? setStatusFilter,
    canSendTestVerification,
    canCancelOrders,
    canCreateManualOrder,
    canRetryVerifications,
    isAtPlanLimit,
    usageRemaining,
    creditDenialCode,
    isSendingTest,
    testFeedback,
    actionFeedback,
    onSendTestVerification,
    onDismissTestFeedback,
    onDismissActionFeedback,
    error,
  }
}
