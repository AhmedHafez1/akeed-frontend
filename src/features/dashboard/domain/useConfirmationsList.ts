'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import { usePendingManualOrders } from '@/features/orders'
import {
  CONFIRMATIONS_PAGE_SIZE,
  confirmationsPageOptions,
} from '../api/verificationQueries'
import {
  useCancelVerificationMutation,
  useRetryVerificationMutation,
} from '../api/verificationMutations'
import {
  FIRST_PAGE,
  currentCursor,
  nextPage,
  pageRange,
  previousPage,
  type CursorStack,
} from './confirmationsPaging'
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
 * The confirmations table in both modes: tab, search and previous/next
 * paging, all answered by the server for the selected period.
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

  // Any change to what is being listed starts again from page one.
  const listKey = `${tab}|${dateRange}|${search}|${importBatchId ?? ''}`
  const [paging, setPaging] = useState<{ key: string; stack: CursorStack }>({
    key: listKey,
    stack: FIRST_PAGE,
  })
  const stack = paging.key === listKey ? paging.stack : FIRST_PAGE

  const query = useQuery({
    ...confirmationsPageOptions({
      tab,
      dateRange,
      search,
      cursor: currentCursor(stack),
      importBatchId,
    }),
    refetchInterval: (current) =>
      current.state.data?.data.some((row) => isAwaitingOutcome(row.status))
        ? AWAITING_POLL_INTERVAL_MS
        : false,
  })

  const page = query.data
  const serverRows = useMemo(() => page?.data ?? [], [page])

  // Orders the merchant just created are layered on at read time, never
  // written into the cache, and only where a new pending order would appear:
  // the first page of "all", unsearched.
  const { pendingOrders } = usePendingManualOrders()
  const admitsPending =
    showPendingOrders && tab === 'all' && !search && stack.length === 1
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
  const range = pageRange(stack, CONFIRMATIONS_PAGE_SIZE, rows.length, total)
  const pageContext = page?.page_context
  const permissions = pageContext?.permissions
  const creditDenialCode = pageContext?.usage?.credit_denial ?? null
  const creditBlocked = Boolean(creditDenialCode)
  const tabCounts = useMemo(() => {
    const counts = pageContext?.tab_counts
    if (!counts || pendingCount === 0) return counts ?? null
    return { ...counts, all: counts.all + pendingCount }
  }, [pageContext?.tab_counts, pendingCount])

  const onNextPage = useCallback(() => {
    const cursor = page?.next_cursor ?? null
    if (!cursor) return
    setPaging({ key: listKey, stack: nextPage(stack, cursor) })
  }, [listKey, page?.next_cursor, stack])

  const onPreviousPage = useCallback(() => {
    setPaging({ key: listKey, stack: previousPage(stack) })
  }, [listKey, stack])

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
    range,
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
    hasNextPage: Boolean(page?.next_cursor),
    hasPreviousPage: stack.length > 1,
    onNextPage,
    onPreviousPage,
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
