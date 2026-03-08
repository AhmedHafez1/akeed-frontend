'use client'

import { useEffect, useState } from 'react'
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

  // Derive query string inline — string concat is too cheap to warrant useMemo
  const verificationQuery =
    statusFilter === 'all' ? '' : `?status=${encodeURIComponent(statusFilter)}`

  useEffect(() => {
    // AbortController gives us proper per-request cancellation.
    // The old `isActive` guard only prevented a fetch from *starting* after
    // unmount; it did not stop setState from firing when a previous in-flight
    // request settled after a rapid filter change.
    const controller = new AbortController()

    setState((prev) => ({
      ...prev,
      isVerificationsLoading: true,
      verificationsError: null,
    }))

    api
      .get<VerificationsResponse>(`/api/verifications${verificationQuery}`)
      .then((response) => {
        if (controller.signal.aborted) return
        setState((prev) => ({
          ...prev,
          verifications: response.verifications,
          isVerificationsLoading: false,
        }))
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState((prev) => ({
          ...prev,
          verificationsError: getErrorMessage(err, 'Failed to load verifications'),
          isVerificationsLoading: false,
        }))
      })

    return () => {
      controller.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationQuery])

  return {
    verifications: state.verifications,
    isVerificationsLoading: state.isVerificationsLoading,
    error: state.verificationsError,
    verificationsError: state.verificationsError,
  }
}
