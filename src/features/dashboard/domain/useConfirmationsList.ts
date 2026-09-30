'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import { usePendingManualOrders } from '@/features/orders'
import { confirmationsListOptions } from '../api/verificationQueries'
import {
  useCancelVerificationMutation,
  useRetryVerificationMutation,
} from '../api/verificationMutations'
import { mergeOptimisticRows } from './optimisticVerification'
import { isAwaitingOutcome } from './verificationLifecycle'
import type {
  ConfirmationsTab,
  DashboardStatsDateRange,
} from '../model/dashboard.model'

const logger = createLogger('ConfirmationsList')

const SEARCH_DEBOUNCE_MS = 300
const AWAITING_POLL_INTERVAL_MS = 30_000
/** What the server accepts as a search; anything else is flagged, not sent. */
const SEARCH_PATTERN = /^[#+\d\s()-]*$/
const SEARCH_MAX_LENGTH = 32

/** How a row action ended; a failure carries the API's error code, if any. */
export type RowActionResult =
  | { status: 'success' }
  | { status: 'error'; code: string | null }

export interface UseConfirmationsListOptions {
  dateRange: DashboardStatsDateRange
  tab: ConfirmationsTab
  /** Narrows the list to the orders one import batch created. */
  importBatchId?: string
  /**
   * Show orders the merchant just created, ahead of the server, at the top of
   * the unfiltered first page. Only standalone can create orders by hand.
   */
  showPendingOrders?: boolean
}

/**
 * The confirmations table in both modes: tab and search answered by
 * the server for the selected period, and further rows loaded as the merchant
 * scrolls.
 */
export function useConfirmationsList({
  dateRange,
  tab,
  importBatchId,
  showPendingOrders = false,
}: UseConfirmationsListOptions) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const trimmedInput = searchInput.trim()
  const isSearchValid =
    SEARCH_PATTERN.test(trimmedInput) &&
    trimmedInput.length <= SEARCH_MAX_LENGTH

  useEffect(() => {
    if (!isSearchValid) return
    const timer = setTimeout(() => setSearch(trimmedInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [isSearchValid, trimmedInput])

  const query = useInfiniteQuery({
    ...confirmationsListOptions({ tab, dateRange, search, importBatchId }),
    refetchInterval: (current) =>
      current.state.data?.pages.some((page) =>
        page.data.some((row) => isAwaitingOutcome(row.status))
      )
        ? AWAITING_POLL_INTERVAL_MS
        : false,
  })

  const pages = query.data?.pages
  const page = pages?.[0]
  const serverRows = useMemo(
    () => (pages ? pages.flatMap((entry) => entry.data) : []),
    [pages]
  )

  // Orders the merchant just created are layered on at read time, never
  // written into the cache, and only where a new pending order would appear:
  // the top of "all", unsearched.
  const { pendingOrders } = usePendingManualOrders()
  const admitsPending = showPendingOrders && tab === 'all' && !search
  const rows = useMemo(
    () =>
      admitsPending
        ? mergeOptimisticRows(
            serverRows,
            query.dataUpdatedAt,
            pendingOrders,
            'all'
          )
        : serverRows,
    [admitsPending, pendingOrders, query.dataUpdatedAt, serverRows]
  )
  const pendingCount = rows.length - serverRows.length

  const total = (page?.total_count ?? serverRows.length) + pendingCount
  const pageContext = page?.page_context
  const permissions = pageContext?.permissions
  const creditDenialCode = pageContext?.usage?.credit_denial ?? null
  const creditBlocked = Boolean(creditDenialCode)
  const tabCounts = useMemo(() => {
    const counts = pageContext?.tab_counts
    if (!counts || pendingCount === 0) return counts ?? null
    return { ...counts, all: counts.all + pendingCount }
  }, [pageContext?.tab_counts, pendingCount])

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  const onLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const { mutateAsync: retryVerification } = useRetryVerificationMutation()
  const { mutateAsync: cancelVerification } = useCancelVerificationMutation()
  const [actingId, setActingId] = useState<string | null>(null)

  const runRowAction = useCallback(
    async (
      verificationId: string,
      action: () => Promise<unknown>
    ): Promise<RowActionResult> => {
      if (actingId) return { status: 'error', code: null }
      setActingId(verificationId)
      try {
        await action()
        return { status: 'success' }
      } catch (error) {
        logger.warn('Row action failed', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        return {
          status: 'error',
          code: error instanceof ApiError ? (error.code ?? null) : null,
        }
      } finally {
        setActingId(null)
      }
    },
    [actingId]
  )

  const onRetry = useCallback(
    (verificationId: string, orderId: string) =>
      runRowAction(verificationId, () => retryVerification(orderId)),
    [retryVerification, runRowAction]
  )

  const onCancel = useCallback(
    (verificationId: string) =>
      runRowAction(verificationId, () => cancelVerification(verificationId)),
    [cancelVerification, runRowAction]
  )

  return {
    rows,
    total,
    tabCounts,
    reportingTimezone: pageContext?.reporting_timezone ?? 'UTC',
    sourceStatus: pageContext?.source?.status ?? null,
    creditDenialCode,
    canWrite: permissions?.can_cancel_orders === true,
    canRetry: permissions?.can_retry_verifications === true && !creditBlocked,
    canSendTest:
      permissions?.can_send_test_verification === true && !creditBlocked,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError && !page,
    retry: () => void query.refetch(),
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    searchInput,
    search,
    isSearchValid,
    onSearchChange: setSearchInput,
    onSearchClear: () => {
      setSearchInput('')
      setSearch('')
    },
    actingId,
    onRetry,
    onCancel,
  }
}
