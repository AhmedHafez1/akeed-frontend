'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/auth'
import type {
  VerificationsResponse,
  VerificationItem,
  VerificationStatusFilter,
} from '@/types/dashboard.model'

interface DashboardState {
  verifications: VerificationItem[]
  isVerificationsLoading: boolean
  verificationsError: string | null
}

const INITIAL_STATE: DashboardState = {
  verifications: [],
  isVerificationsLoading: true,
  verificationsError: null,
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

  // Combine errors for backward compatibility
  const error = state.verificationsError

  return {
    verifications: state.verifications,
    isVerificationsLoading: state.isVerificationsLoading,
    error,
    verificationsError: state.verificationsError,
  }
}
