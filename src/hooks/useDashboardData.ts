'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/auth'
import type {
  OrdersResponse,
  VerificationsResponse,
  VerificationItem,
  VerificationStatusFilter,
  OrderItem,
} from '@/types/dashboard.model'

const DEFAULT_ERROR_MESSAGE = 'Failed to load data'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

export function useDashboardData(statusFilter: VerificationStatusFilter) {
  const [verifications, setVerifications] = useState<VerificationItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [isVerificationsLoading, setIsVerificationsLoading] = useState(true)
  const [isOrdersLoading, setIsOrdersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const verificationQuery = useMemo(() => {
    if (statusFilter === 'all') return ''
    return `?status=${encodeURIComponent(statusFilter)}`
  }, [statusFilter])

  useEffect(() => {
    let isActive = true

    const loadVerifications = async () => {
      setIsVerificationsLoading(true)
      setError(null)
      try {
        const response = await api.get<VerificationsResponse>(
          `/api/verifications${verificationQuery}`
        )
        if (!isActive) return
        setVerifications(response.verifications)
      } catch (err) {
        if (!isActive) return
        setError(getErrorMessage(err, DEFAULT_ERROR_MESSAGE))
      } finally {
        if (isActive) setIsVerificationsLoading(false)
      }
    }

    loadVerifications()

    return () => {
      isActive = false
    }
  }, [verificationQuery])

  useEffect(() => {
    let isActive = true

    const loadOrders = async () => {
      setIsOrdersLoading(true)
      setError(null)
      try {
        const response = await api.get<OrdersResponse>('/api/orders')
        if (!isActive) return
        setOrders(response.orders)
      } catch (err) {
        if (!isActive) return
        setError(getErrorMessage(err, 'Failed to load orders'))
      } finally {
        if (isActive) setIsOrdersLoading(false)
      }
    }

    loadOrders()

    return () => {
      isActive = false
    }
  }, [])

  return {
    verifications,
    orders,
    isVerificationsLoading,
    isOrdersLoading,
    error,
  }
}
