'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminApiError, adminRequest } from './adminApi'
import type { AccountDetail } from './standalone-billing-operations.model'

export const standaloneBillingPath = '/api/admin/standalone-billing'

export function toAdminApiError(cause: unknown): AdminApiError {
  return cause instanceof AdminApiError
    ? cause
    : new AdminApiError('Request failed', 0, null)
}

interface LoadResult {
  key: string
  detail: AccountDetail | null
  error: AdminApiError | null
}

/**
 * Loads one account's staff billing detail. Every figure on the page comes
 * from this response; nothing is recomputed in the browser. A refresh keeps
 * the last good detail on screen until the new one arrives.
 */
export function useStandaloneBillingAccount(orgId: string) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<LoadResult | null>(null)
  const requestKey = `${orgId}:${revision}`

  useEffect(() => {
    let current = true
    adminRequest<AccountDetail>(
      `${standaloneBillingPath}/accounts/${encodeURIComponent(orgId)}`
    )
      .then((detail) => {
        if (current) setResult({ key: requestKey, detail, error: null })
      })
      .catch((cause: unknown) => {
        if (!current) return
        console.error('[Admin] Standalone billing account failed', cause)
        setResult((previous) => ({
          key: requestKey,
          detail: previous?.detail ?? null,
          error: toAdminApiError(cause),
        }))
      })
    return () => {
      current = false
    }
  }, [orgId, requestKey])

  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  const loading = result?.key !== requestKey

  return {
    detail: result?.detail ?? null,
    loading,
    error: loading ? null : (result?.error ?? null),
    refresh,
  }
}
