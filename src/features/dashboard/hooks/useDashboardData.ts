'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/auth'
import type {
  VerificationsResponse,
  VerificationItem,
  VerificationStatusFilter,
} from '@/types/dashboard.model'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

export function useDashboardData(statusFilter: VerificationStatusFilter) {
  const [verifications, setVerifications] = useState<VerificationItem[]>([])
  const [verificationsError, setVerificationsError] = useState<string | null>(
    null
  )
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null)

  // Derive query string inline — string concat is too cheap to warrant useMemo
  const verificationQuery =
    statusFilter === 'all' ? '' : `?status=${encodeURIComponent(statusFilter)}`

  useEffect(() => {
    // AbortController gives us proper per-request cancellation.
    // The old `isActive` guard only prevented a fetch from starting after
    // unmount; it did not stop updates when an old in-flight request settled.
    const controller = new AbortController()

    api
      .get<VerificationsResponse>(`/api/verifications${verificationQuery}`)
      .then((response) => {
        if (controller.signal.aborted) return
        setVerifications(response.verifications)
        setVerificationsError(null)
        setResolvedQuery(verificationQuery)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setVerificationsError(getErrorMessage(err, 'Failed to load verifications'))
        setResolvedQuery(verificationQuery)
      })

    return () => {
      controller.abort()
    }
  }, [verificationQuery])

  const isVerificationsLoading = resolvedQuery !== verificationQuery
  const activeError =
    resolvedQuery === verificationQuery ? verificationsError : null

  return {
    verifications,
    isVerificationsLoading,
    error: activeError,
    verificationsError: activeError,
  }
}
