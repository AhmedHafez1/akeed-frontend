'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import type { CancelOrderResponse } from '@/shared/types/commerce-outcome.model'
import { retryManualOrderVerification } from '@/features/orders/api/manualOrderApi'
import { useStandaloneOrders } from '../hooks/useStandaloneOrders'
import { useStandaloneDashboardStats } from '../hooks/useStandaloneDashboardStats'
import type {
  DashboardStatsDateRange,
  OrderItem,
  StandaloneOrderFilter,
} from '../model/dashboard.model'
import type {
  DateRangeFilterOption,
  StandaloneDashboardSkinProps,
  StandaloneOrderFilterOption,
  TestFeedback,
} from './dashboard.types'
import { getTestVerificationFeedbackKey } from './testVerificationFeedback'

const logger = createLogger('Dashboard')

interface SendTestVerificationResponse {
  success: boolean
  skipped?: boolean
  reason?: string
}

function canMarkCanceled(order: OrderItem): boolean {
  return (
    order.lifecycle.status === 'no_reply' &&
    order.verification?.capabilities.some(
      (capability) =>
        capability.action === 'merchant_no_reply_cancellation' &&
        capability.supported
    ) === true
  )
}

export function useDashboard(): StandaloneDashboardSkinProps {
  const t = useTranslations('dashboard')
  const [orderFilter, setOrderFilter] = useState<StandaloneOrderFilter>('all')
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DashboardStatsDateRange>('last_30_days')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testFeedback, setTestFeedback] = useState<TestFeedback | null>(null)
  const [actionFeedback, setActionFeedback] = useState<TestFeedback | null>(
    null
  )
  const [confirmingCancelOrderId, setConfirmingCancelOrderId] = useState<
    string | null
  >(null)
  const [actingOrderId, setActingOrderId] = useState<string | null>(null)
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})

  const orderData = useStandaloneOrders(
    orderFilter,
    dateRangeFilter,
    t('orders.errors.load')
  )
  const statsData = useStandaloneDashboardStats(
    dateRangeFilter,
    t('orders.errors.metrics')
  )
  const refetchOrders = orderData.refetch
  const refetchStats = statsData.refetch
  const pageContext = orderData.pageContext
  const stats = statsData.stats
  const sourceStatus =
    stats?.source.status ?? pageContext?.source?.status ?? 'not_connected'
  const canSendTestVerification =
    pageContext?.permissions?.can_send_test_verification === true
  const canCancelOrders = pageContext?.permissions?.can_cancel_orders === true
  const canCreateManualOrder =
    pageContext?.permissions?.can_create_manual_order === true
  const canRetryVerifications =
    pageContext?.permissions?.can_retry_verifications === true

  const orderFilters = useMemo<ReadonlyArray<StandaloneOrderFilterOption>>(
    () => [
      { id: 'all', label: t('orders.filters.all') },
      { id: 'in_progress', label: t('orders.filters.inProgress') },
      { id: 'needs_attention', label: t('orders.filters.needsAttention') },
      { id: 'confirmed', label: t('orders.filters.confirmed') },
      { id: 'canceled', label: t('orders.filters.canceled') },
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

  const refreshDashboard = useCallback(() => {
    refetchOrders()
    refetchStats()
  }, [refetchOrders, refetchStats])

  const onDismissTestFeedback = useCallback(() => setTestFeedback(null), [])
  const onDismissActionFeedback = useCallback(() => setActionFeedback(null), [])

  const clearOrderError = useCallback((orderId: string) => {
    setActionErrors((current) => {
      const next = { ...current }
      delete next[orderId]
      return next
    })
  }, [])

  const onRequestCancelOrder = useCallback(
    (orderId: string) => {
      setConfirmingCancelOrderId(orderId)
      clearOrderError(orderId)
    },
    [clearOrderError]
  )

  const onDismissCancelOrder = useCallback(
    (orderId: string) => {
      setConfirmingCancelOrderId((current) =>
        current === orderId ? null : current
      )
      clearOrderError(orderId)
    },
    [clearOrderError]
  )

  const onConfirmCancelOrder = useCallback(
    async (orderId: string) => {
      if (!canCancelOrders || actingOrderId) return
      const order = orderData.orders.find(
        (candidate) => candidate.id === orderId
      )
      if (!order?.verification || !canMarkCanceled(order)) return
      setActingOrderId(orderId)
      clearOrderError(orderId)
      setActionFeedback(null)
      try {
        await api.post<CancelOrderResponse>(
          `/api/verifications/${order.verification.id}/cancel`
        )
        setConfirmingCancelOrderId(null)
        setActionFeedback({
          tone: 'success',
          message: t('orders.actions.markCanceledSuccess'),
        })
        refreshDashboard()
      } catch (error) {
        logger.warn('Failed to mark order canceled', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        setActionErrors((current) => ({
          ...current,
          [orderId]: t('orders.actions.markCanceledError'),
        }))
      } finally {
        setActingOrderId(null)
      }
    },
    [
      actingOrderId,
      canCancelOrders,
      clearOrderError,
      orderData.orders,
      refreshDashboard,
      t,
    ]
  )

  const onRetryVerification = useCallback(
    async (orderId: string) => {
      if (!canRetryVerifications || actingOrderId) return
      const order = orderData.orders.find(
        (candidate) => candidate.id === orderId
      )
      if (!order?.lifecycle.retryable) return
      setActingOrderId(orderId)
      clearOrderError(orderId)
      setActionFeedback(null)
      try {
        await retryManualOrderVerification(orderId)
        setActionFeedback({
          tone: 'success',
          message: t('orders.actions.retrySuccess'),
        })
        refreshDashboard()
      } catch (error) {
        logger.warn('Failed to retry order verification', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        setActionErrors((current) => ({
          ...current,
          [orderId]: t('orders.actions.retryError'),
        }))
      } finally {
        setActingOrderId(null)
      }
    },
    [
      actingOrderId,
      canRetryVerifications,
      clearOrderError,
      orderData.orders,
      refreshDashboard,
      t,
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
        refreshDashboard()
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
      } catch (error) {
        logger.warn('Failed to send test verification', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        setTestFeedback({
          tone: 'critical',
          message: t(getTestVerificationFeedbackKey(error)),
        })
      } finally {
        setIsSendingTest(false)
      }
    },
    [canSendTestVerification, refreshDashboard, t]
  )

  const error = useMemo(() => {
    if (orderData.error && statsData.error) {
      return `${orderData.error} ${statsData.error}`
    }
    return orderData.error ?? statsData.error
  }, [orderData.error, statsData.error])

  return {
    stats,
    reportingTimezone:
      stats?.reporting_timezone ?? pageContext?.reporting_timezone ?? 'UTC',
    isStatsLoading: statsData.isLoading,
    isAutoVerifyEnabled: stats?.automation.is_auto_verify_enabled ?? false,
    sourceStatus,
    dateRangeFilter,
    dateRangeOptions,
    onDateRangeFilterChange: setDateRangeFilter,
    orders: orderData.orders,
    totalOrderCount: orderData.totalCount,
    isOrdersLoading: orderData.isLoading,
    hasMoreOrders: orderData.hasMore,
    isLoadingMoreOrders: orderData.isLoadingMore,
    onLoadMoreOrders: orderData.loadMore,
    orderFilter,
    orderFilters,
    onOrderFilterChange: setOrderFilter,
    confirmingCancelOrderId,
    actingOrderId,
    actionErrors,
    onRequestCancelOrder,
    onDismissCancelOrder,
    onConfirmCancelOrder,
    onRetryVerification,
    canSendTestVerification,
    canCancelOrders,
    canCreateManualOrder,
    canRetryVerifications,
    isSendingTest,
    testFeedback,
    actionFeedback,
    onSendTestVerification,
    onDismissTestFeedback,
    onDismissActionFeedback,
    onManualOrderAccepted: refreshDashboard,
    error,
  }
}
