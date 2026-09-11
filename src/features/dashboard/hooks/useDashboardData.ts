'use client'

import { useCallback, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { isAwaitingOutcome } from '../domain/verificationLifecycle'
import { verificationListInfiniteOptions } from '../api/verificationQueries'
import type {
  DashboardStatsDateRange,
  VerificationsResponse,
  VerificationItem,
  VerificationStatusFilter,
} from '../model/dashboard.model'

const AWAITING_POLL_INTERVAL_MS = 30_000

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

/** Rows of every loaded page, first occurrence wins across page boundaries. */
function flattenPages(
  pages: ReadonlyArray<VerificationsResponse>
): VerificationItem[] {
  const seen = new Set<string>()
  const rows: VerificationItem[] = []
  for (const page of pages) {
    for (const row of page.data) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      rows.push(row)
    }
  }
  return rows
}

/**
 * The verifications table for one filter selection, read from the shared cache.
 *
 * Verification outcomes arrive over a WhatsApp webhook, not from anything the
 * merchant did in this tab, so the list re-reads when the tab regains focus and
 * polls slowly while at least one loaded row is still awaiting an outcome. A
 * refetch reloads every page already loaded, so paging further in no longer
 * has to switch background refresh off to keep the merchant's rows in place.
 */
export function useDashboardData(
  statusFilter: VerificationStatusFilter,
  dateRangeFilter: DashboardStatsDateRange
) {
  const query = useInfiniteQuery({
    ...verificationListInfiniteOptions(statusFilter, dateRangeFilter),
    refetchInterval: (current) =>
      current.state.data?.pages.some((page) =>
        page.data.some((row) => isAwaitingOutcome(row.status))
      )
        ? AWAITING_POLL_INTERVAL_MS
        : false,
  })
  const {
    data,
    dataUpdatedAt,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    isPending,
    refetch: refetchQuery,
  } = query

  const pages = data?.pages
  const verifications = useMemo(() => flattenPages(pages ?? []), [pages])
  const totalCount =
    pages?.findLast((page) => page.total_count != null)?.total_count ??
    verifications.length
  const pageContext = pages?.findLast(
    (page) => page.page_context !== undefined
  )?.page_context
  const activeError = error
    ? getErrorMessage(
        error,
        isFetchNextPageError
          ? 'Failed to load more verifications'
          : 'Failed to load verifications'
      )
    : null

  const onLoadMoreVerifications = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || isPending) return
    await fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isPending])

  const refetch = useCallback(() => {
    void refetchQuery()
  }, [refetchQuery])

  return {
    verifications,
    totalCount,
    isVerificationsLoading: isPending,
    hasMoreVerifications: hasNextPage,
    isLoadingMoreVerifications: isFetchingNextPage,
    onLoadMoreVerifications,
    refetch,
    error: activeError,
    verificationsError: activeError,
    pageContext,
    /** When the rows were last fetched; lets optimistic rows hand over. */
    verificationsUpdatedAt: dataUpdatedAt,
  }
}
