'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/auth'
import type {
  OrdersResponse,
  VerificationsResponse,
  VerificationItem,
  VerificationStatusFilter,
  OrderItem,
} from '@/types/dashboard.model'

interface DashboardState {
  verifications: VerificationItem[]
  orders: OrderItem[]
  isVerificationsLoading: boolean
  isOrdersLoading: boolean
  verificationsError: string | null
  ordersError: string | null
}

const INITIAL_STATE: DashboardState = {
  verifications: [],
  orders: [],
  isVerificationsLoading: true,
  isOrdersLoading: true,
  verificationsError: null,
  ordersError: null,
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

export function useDashboardData(statusFilter: VerificationStatusFilter) {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE)

  const verificationQuery = useMemo(() => {
    if (statusFilter === 'all') return ''
    return `?status=${encodeURIComponent(statusFilter)}`
  }, [statusFilter])

  const fetchVerifications = useCallback(async (query: string) => {
    setState((prev) => ({
      ...prev,
      isVerificationsLoading: true,
      verificationsError: null,
    }))

    try {
      const response = await api.get<VerificationsResponse>(
        `/api/verifications${query}`
      )
      setState((prev) => ({
        ...prev,
        verifications: response.verifications,
        isVerificationsLoading: false,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        verificationsError: getErrorMessage(
          err,
          'Failed to load verifications'
        ),
        isVerificationsLoading: false,
      }))
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isOrdersLoading: true,
      ordersError: null,
    }))

    try {
      const response = await api.get<OrdersResponse>('/api/orders')
      setState((prev) => ({
        ...prev,
        orders: response.orders,
        isOrdersLoading: false,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        ordersError: getErrorMessage(err, 'Failed to load orders'),
        isOrdersLoading: false,
      }))
    }
  }, [])

  // Fetch verifications when filter changes
  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!isActive) return
      await fetchVerifications(verificationQuery)
    }

    load()

    return () => {
      isActive = false
    }
  }, [verificationQuery, fetchVerifications])

  // Fetch orders once on mount
  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!isActive) return
      await fetchOrders()
    }

    load()

    return () => {
      isActive = false
    }
  }, [fetchOrders])

  // Combine errors for backward compatibility
  const error = state.verificationsError || state.ordersError

  return {
    verifications: state.verifications,
    orders: state.orders,
    isVerificationsLoading: state.isVerificationsLoading,
    isOrdersLoading: state.isOrdersLoading,
    error,
    verificationsError: state.verificationsError,
    ordersError: state.ordersError,
  }
}
