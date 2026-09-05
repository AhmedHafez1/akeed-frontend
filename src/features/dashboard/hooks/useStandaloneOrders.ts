'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/shared/lib/auth'
import type {
  DashboardStatsDateRange,
  OrderItem,
  OrdersResponse,
  StandaloneOrderFilter,
} from '../model/dashboard.model'

const FILTER_STATUSES: Record<Exclude<StandaloneOrderFilter, 'all'>, string> = {
  in_progress: 'accepted,processing,pending,sent,delivered,read',
  needs_attention: 'ineligible,blocked,failed,expired,no_reply,review_required',
  confirmed: 'confirmed',
  canceled: 'canceled',
}

export function useStandaloneOrders(
  filter: StandaloneOrderFilter,
  dateRange: DashboardStatsDateRange,
  fallbackError: string
) {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [pageContext, setPageContext] =
    useState<OrdersResponse['page_context']>()
  const [error, setError] = useState<string | null>(null)
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [refetchKey, setRefetchKey] = useState(0)

  const query = useMemo(() => {
    const params = new URLSearchParams({ date_range: dateRange })
    if (filter !== 'all') params.set('status', FILTER_STATUSES[filter])
    return `?${params.toString()}`
  }, [dateRange, filter])

  useEffect(() => {
    const controller = new AbortController()
    api
      .get<OrdersResponse>(`/api/orders${query}`)
      .then((response) => {
        if (controller.signal.aborted) return
        setOrders(response.data)
        setTotalCount(response.total_count)
        setNextCursor(response.next_cursor)
        setPageContext(response.page_context)
        setError(null)
        setResolvedQuery(query)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setError(fallbackError)
        setNextCursor(null)
        setResolvedQuery(query)
      })
    return () => controller.abort()
  }, [fallbackError, query, refetchKey])

  const isLoading = resolvedQuery !== query
  const activeError = resolvedQuery === query ? error : null

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoading || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const response = await api.get<OrdersResponse>(
        `/api/orders${query}&cursor=${encodeURIComponent(nextCursor)}`
      )
      setOrders((current) => [...current, ...response.data])
      setTotalCount(response.total_count)
      setNextCursor(response.next_cursor)
      setPageContext(response.page_context ?? pageContext)
      setError(null)
    } catch {
      setError(fallbackError)
    } finally {
      setIsLoadingMore(false)
    }
  }, [fallbackError, isLoading, isLoadingMore, nextCursor, pageContext, query])

  return {
    orders,
    totalCount,
    pageContext,
    error: activeError,
    isLoading,
    hasMore: Boolean(nextCursor),
    isLoadingMore,
    loadMore,
    refetch: useCallback(() => setRefetchKey((key) => key + 1), []),
  }
}
