'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/shared/lib/auth'
import type {
  DashboardStatsDateRange,
  VerificationsResponse,
  VerificationItem,
  VerificationStatusFilter,
} from '../model/dashboard.model'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

export function useDashboardData(
  statusFilter: VerificationStatusFilter,
  dateRangeFilter: DashboardStatsDateRange
) {
  const [verifications, setVerifications] = useState<VerificationItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [pageContext, setPageContext] =
    useState<VerificationsResponse['page_context']>(undefined)
  const [verificationsError, setVerificationsError] = useState<string | null>(
    null
  )
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null)
  const [refetchKey, setRefetchKey] = useState(0)

  const verificationQuery = useMemo(() => {
    const queryParams = new URLSearchParams()
    queryParams.set('date_range', dateRangeFilter)

    if (statusFilter === 'awaiting_response') {
      queryParams.set('status', 'sent,delivered,read,no_reply')
    } else if (statusFilter !== 'all') {
      queryParams.set('status', statusFilter)
    }

    return `?${queryParams.toString()}`
  }, [dateRangeFilter, statusFilter])

  useEffect(() => {
    const controller = new AbortController()

    api
      .get<VerificationsResponse>(`/api/verifications${verificationQuery}`)
      .then((response) => {
        if (controller.signal.aborted) return
        setVerifications(response.data)
        setNextCursor(response.next_cursor)
        setPageContext(response.page_context)
        setVerificationsError(null)
        setResolvedQuery(verificationQuery)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setVerificationsError(
          getErrorMessage(err, 'Failed to load verifications')
        )
        setNextCursor(null)
        setResolvedQuery(verificationQuery)
      })

    return () => {
      controller.abort()
    }
  }, [verificationQuery, refetchKey])

  const isVerificationsLoading = resolvedQuery !== verificationQuery
  const activeError =
    resolvedQuery === verificationQuery ? verificationsError : null

  const onLoadMoreVerifications = useCallback(async () => {
    if (!nextCursor || isLoadingMore || isVerificationsLoading) {
      return
    }

    setIsLoadingMore(true)

    try {
      const cursorQuery = `${verificationQuery}&cursor=${encodeURIComponent(nextCursor)}`
      const response = await api.get<VerificationsResponse>(
        `/api/verifications${cursorQuery}`
      )

      setVerifications((previous) => [...previous, ...response.data])
      setNextCursor(response.next_cursor)
      setPageContext(response.page_context ?? pageContext)
      setVerificationsError(null)
    } catch (error) {
      setVerificationsError(
        getErrorMessage(error, 'Failed to load more verifications')
      )
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    isLoadingMore,
    isVerificationsLoading,
    nextCursor,
    pageContext,
    verificationQuery,
  ])

  return {
    verifications,
    isVerificationsLoading,
    hasMoreVerifications: Boolean(nextCursor),
    isLoadingMoreVerifications: isLoadingMore,
    onLoadMoreVerifications,
    refetch: useCallback(() => setRefetchKey((k) => k + 1), []),
    error: activeError,
    verificationsError: activeError,
    pageContext,
  }
}
