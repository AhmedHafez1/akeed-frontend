'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createLogger } from '@/shared/lib/logger'
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
import { isAwaitingOutcome } from './verificationLifecycle'
import type {
  ConfirmationsTab,
  DashboardStatsDateRange,
} from '../model/dashboard.model'

const logger = createLogger('EmbeddedConfirmations')

const SEARCH_DEBOUNCE_MS = 300
const AWAITING_POLL_INTERVAL_MS = 30_000
/** What the server accepts as a search; anything else is flagged, not sent. */
const SEARCH_PATTERN = /^[#+\d\s()-]*$/
const SEARCH_MAX_LENGTH = 32

export type RowActionResult = 'success' | 'error'

/**
 * The embedded confirmations table: tab, search and previous/next paging, all
 * answered by the server for the selected period.
 */
export function useEmbeddedConfirmations({
  dateRange,
  tab,
}: {
  dateRange: DashboardStatsDateRange
  tab: ConfirmationsTab
}) {
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
  const listKey = `${tab}|${dateRange}|${search}`
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
    }),
    refetchInterval: (current) =>
      current.state.data?.data.some((row) => isAwaitingOutcome(row.status))
        ? AWAITING_POLL_INTERVAL_MS
        : false,
  })

  const page = query.data
  const rows = useMemo(() => page?.data ?? [], [page])
  const total = page?.total_count ?? rows.length
  const range = pageRange(stack, CONFIRMATIONS_PAGE_SIZE, rows.length, total)
  const permissions = page?.page_context?.permissions
  const creditBlocked = Boolean(page?.page_context?.usage?.credit_denial)

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
      if (actingId) return 'error'
      setActingId(verificationId)
      try {
        await action()
        return 'success'
      } catch (error) {
        logger.warn('Row action failed', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
        return 'error'
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
    tabCounts: page?.page_context?.tab_counts ?? null,
    reportingTimezone: page?.page_context?.reporting_timezone ?? 'UTC',
    canWrite: permissions?.can_cancel_orders === true,
    canRetry: permissions?.can_retry_verifications === true && !creditBlocked,
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
