'use client'

/**
 * useDashboard — Domain Hook (Logic Only)
 *
 * This is the "headless controller" for the Dashboard feature.
 * It owns ALL business logic: state, data fetching, derived values,
 * and event handlers.
 *
 * Rules:
 *  - NO JSX or rendering code
 *  - NO imports from Polaris or Tailwind
 *  - Returns a DashboardSkinProps object consumed by any UI skin
 *  - Wraps the existing useDashboardData hook — no data logic duplication
 */

import { useCallback, useMemo, useState } from 'react'
import { useDashboardData } from '@/hooks/useDashboardData'
import type { VerificationStatusFilter } from '@/types/dashboard.model'
import type { DashboardSkinProps, StatusFilterOption } from './dashboard.types'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_FILTERS: ReadonlyArray<StatusFilterOption> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'sent', label: 'Sent' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'canceled', label: 'Canceled' },
] as const

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDashboard(): DashboardSkinProps {
  const [statusFilter, setStatusFilter] =
    useState<VerificationStatusFilter>('all')

  const {
    verifications,
    orders,
    isVerificationsLoading,
    isOrdersLoading,
    error,
  } = useDashboardData(statusFilter)

  // ── Derived values ──────────────────────────────────────────────────────

  const hasVerifications = verifications.length > 0
  const hasOrders = orders.length > 0

  const emptyVerificationsMessage = useMemo(() => {
    if (statusFilter === 'all') {
      return 'No verifications yet. Once an order is received, verification requests will appear here.'
    }
    return 'No verifications match the selected status.'
  }, [statusFilter])

  // ── Handlers ────────────────────────────────────────────────────────────

  const onStatusFilterChange = useCallback(
    (filter: VerificationStatusFilter) => {
      setStatusFilter(filter)
    },
    []
  )

  // ── Return skin-agnostic props ──────────────────────────────────────────

  return {
    verifications,
    isVerificationsLoading,
    hasVerifications,
    emptyVerificationsMessage,

    orders,
    isOrdersLoading,
    hasOrders,

    statusFilter,
    statusFilters: STATUS_FILTERS,
    onStatusFilterChange,

    error,
  }
}
