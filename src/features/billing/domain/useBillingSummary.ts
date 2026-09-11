'use client'

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { creditSummaryOptions } from '../api/billingQueries'

/**
 * The organization's credit balance, shared by the sidebar, settings and the
 * billing page through one cached query.
 *
 * Nothing here refreshes on a timer or listens for orders: whatever spends or
 * adds credits emits a domain event, and the invalidation it triggers is what
 * brings every consumer up to date.
 */
export function useBillingSummary() {
  const query = useQuery(creditSummaryOptions())
  const { refetch } = query

  const refresh = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    summary: query.data ?? null,
    isLoading: query.isPending,
    // A failed background refresh keeps the last balance on screen rather than
    // replacing it with an error state; only a balance we never had is an error.
    error: query.data === undefined ? query.error : null,
    refresh,
  }
}
