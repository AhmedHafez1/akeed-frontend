'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/shared/lib/auth'
import { isAwaitingOutcome } from '../domain/verificationLifecycle'
import { buildVerificationsQuery } from '../domain/verificationFilters'
import { useOutcomeRefresh } from './useOutcomeRefresh'
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
  const [totalCount, setTotalCount] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [pageContext, setPageContext] =
    useState<VerificationsResponse['page_context']>(undefined)
  const [verificationsError, setVerificationsError] = useState<string | null>(
    null
  )
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null)
  const [refetchKey, setRefetchKey] = useState(0)
  const [hasLoadedMore, setHasLoadedMore] = useState(false)
  const activeRequest = useRef<AbortController | null>(null)

  const verificationQuery = useMemo(
    () => buildVerificationsQuery(statusFilter, dateRangeFilter),
    [dateRangeFilter, statusFilter]
  )

  useEffect(() => {
    const controller = new AbortController()
    activeRequest.current = controller

    api
      .get<VerificationsResponse>(`/api/verifications${verificationQuery}`)
      .then((response) => {
        if (controller.signal.aborted) return
        setVerifications(response.data)
        setTotalCount(response.total_count ?? response.data.length)
        setNextCursor(response.next_cursor)
        setPageContext(response.page_context)
        setVerificationsError(null)
        setResolvedQuery(verificationQuery)
        setHasLoadedMore(false)
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
    const controller = activeRequest.current
    if (
      !nextCursor ||
      isLoadingMore ||
      isVerificationsLoading ||
      !controller ||
      controller.signal.aborted
    ) {
      return
    }

    setIsLoadingMore(true)

    try {
      const cursorQuery = `${verificationQuery}&cursor=${encodeURIComponent(nextCursor)}`
      const response = await api.get<VerificationsResponse>(
        `/api/verifications${cursorQuery}`
      )
      if (controller.signal.aborted) return

      setVerifications((previous) => [...previous, ...response.data])
      setHasLoadedMore(true)
      setTotalCount(response.total_count ?? totalCount)
      setNextCursor(response.next_cursor)
      setPageContext(response.page_context ?? pageContext)
      setVerificationsError(null)
    } catch (error) {
      if (controller.signal.aborted) return
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
    totalCount,
    verificationQuery,
  ])

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), [])

  // Background refresh reloads the first page, so it stays off once the
  // merchant has paged further in — their loaded rows must not disappear.
  useOutcomeRefresh(
    refetch,
    !hasLoadedMore &&
      verifications.some((verification) =>
        isAwaitingOutcome(verification.status)
      )
  )

  return {
    verifications,
    totalCount,
    isVerificationsLoading,
    hasMoreVerifications: Boolean(nextCursor),
    isLoadingMoreVerifications: isLoadingMore,
    onLoadMoreVerifications,
    refetch,
    error: activeError,
    verificationsError: activeError,
    pageContext,
  }
}
