'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminApiError, adminRequest } from './adminApi'
import type {
  AccountFilters,
  CreditAccountList,
} from './standalone-billing.model'

const path = '/api/admin/standalone-billing'

export const emptyAccountFilters: AccountFilters = {
  accountStatus: '',
  balance: '',
  reconciliation: '',
}

function accountQuery(filters: AccountFilters, cursor: string | undefined) {
  const query = new URLSearchParams({ limit: '50' })
  if (cursor) query.set('cursor', cursor)
  for (const [key, value] of Object.entries(filters))
    if (value) query.set(key, value)
  return query.toString()
}

interface AccountListResult {
  /** The request this result answers; a different key means one is loading. */
  key: string
  page: CreditAccountList | null
  error: AdminApiError | null
}

export function useStandaloneBilling() {
  const [cursors, setCursors] = useState<string[]>([])
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<AccountListResult | null>(null)
  const [filters, setFilterState] =
    useState<AccountFilters>(emptyAccountFilters)
  const cursor = cursors.at(-1)
  const query = accountQuery(filters, cursor)
  const requestKey = `${query}#${revision}`
  const loading = result?.key !== requestKey

  const toError = useCallback((cause: unknown) => {
    console.error('[Admin] Standalone billing request failed', cause)
    return cause instanceof AdminApiError
      ? cause
      : new AdminApiError('Request failed', 0, null)
  }, [])

  useEffect(() => {
    let current = true
    adminRequest<CreditAccountList>(`${path}/accounts?${query}`)
      .then((response) => {
        if (current) setResult({ key: requestKey, page: response, error: null })
      })
      .catch((cause: unknown) => {
        if (current)
          setResult({ key: requestKey, page: null, error: toError(cause) })
      })
    return () => {
      current = false
    }
  }, [query, requestKey, toError])

  // The previous page stays visible while the next one loads; an error from
  // an earlier request is not shown against a new one.
  const page = result?.page ?? null
  const error = loading ? null : (result?.error ?? null)

  /** A new filter starts again from the first page. */
  function setFilter<K extends keyof AccountFilters>(
    key: K,
    value: AccountFilters[K]
  ) {
    setCursors([])
    setFilterState((current) => ({ ...current, [key]: value }))
  }

  return {
    page,
    filters,
    setFilter,
    resetFilters: () => {
      setCursors([])
      setFilterState(emptyAccountFilters)
    },
    loading,
    error,
    refresh: () => setRevision((value) => value + 1),
    next: () => {
      if (page?.nextCursor)
        setCursors((current) => [...current, page.nextCursor!])
    },
    previous: () => setCursors((current) => current.slice(0, -1)),
    hasPrevious: cursors.length > 0,
  }
}
