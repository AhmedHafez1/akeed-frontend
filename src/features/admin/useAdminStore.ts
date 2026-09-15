'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AdminStoreDetailResponse,
  AdminStoreVerificationsResponse,
} from './admin.model'
import { getAdminStore, getAdminStoreVerifications } from './adminApi'
import { toAdminApiError } from './useStandaloneBillingAccount'
import type { AdminApiError } from './adminApi'

interface StoreLoadResult {
  key: string
  response: AdminStoreDetailResponse | null
  error: AdminApiError | null
}

/**
 * Loads one store's admin detail. A refresh keeps the last good response on
 * screen until the new one arrives.
 */
export function useAdminStore(integrationId: string) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<StoreLoadResult | null>(null)
  const requestKey = `${integrationId}:${revision}`

  useEffect(() => {
    let current = true
    getAdminStore(integrationId)
      .then((response) => {
        if (current) setResult({ key: requestKey, response, error: null })
      })
      .catch((cause: unknown) => {
        if (!current) return
        console.error('[Admin] Store detail failed', cause)
        setResult((previous) => ({
          key: requestKey,
          response: previous?.response ?? null,
          error: toAdminApiError(cause),
        }))
      })
    return () => {
      current = false
    }
  }, [integrationId, requestKey])

  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  const loading = result?.key !== requestKey

  return {
    response: result?.response ?? null,
    loading,
    error: loading ? null : (result?.error ?? null),
    refresh,
  }
}

export interface AdminStoreVerificationFilters {
  status: string
  includeTest: boolean
}

const PAGE_SIZE = 25

function buildQuery(filters: AdminStoreVerificationFilters, cursor?: string) {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
  if (filters.status) params.set('status', filters.status)
  if (filters.includeTest) params.set('include_test', 'true')
  if (cursor) params.set('cursor', cursor)
  return params.toString()
}

/**
 * Pages a store's verifications by cursor. Filter changes restart from the
 * first page and discard responses to superseded requests.
 */
export function useAdminStoreVerifications(
  integrationId: string,
  filters: AdminStoreVerificationFilters,
  revision: number
) {
  const sequence = useRef(0)
  const [response, setResponse] =
    useState<AdminStoreVerificationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [paginationError, setPaginationError] = useState<AdminApiError | null>(
    null
  )
  const { status, includeTest } = filters

  const load = useCallback(async () => {
    const current = ++sequence.current
    setLoading(true)
    setError(null)
    setPaginationError(null)
    try {
      const next = await getAdminStoreVerifications(
        integrationId,
        buildQuery({ status, includeTest })
      )
      if (current === sequence.current) setResponse(next)
    } catch (cause) {
      if (current !== sequence.current) return
      console.error('[Admin] Store verifications failed', cause)
      setError(toAdminApiError(cause))
    } finally {
      if (current === sequence.current) setLoading(false)
    }
  }, [includeTest, integrationId, status])

  useEffect(() => {
    void load()
  }, [load, revision])

  const loadMore = useCallback(async () => {
    if (!response?.next_cursor) return
    const current = sequence.current
    setLoadingMore(true)
    setPaginationError(null)
    try {
      const next = await getAdminStoreVerifications(
        integrationId,
        buildQuery({ status, includeTest }, response.next_cursor)
      )
      if (current !== sequence.current) return
      setResponse({
        ...next,
        data: [...response.data, ...next.data],
      })
    } catch (cause) {
      if (current !== sequence.current) return
      console.error('[Admin] Store verifications page failed', cause)
      setPaginationError(toAdminApiError(cause))
    } finally {
      setLoadingMore(false)
    }
  }, [includeTest, integrationId, response, status])

  return {
    response,
    loading,
    loadingMore,
    error,
    paginationError,
    reload: load,
    loadMore,
  }
}
