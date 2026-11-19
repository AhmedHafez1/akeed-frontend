'use client'

import { useEffect, useState } from 'react'
import { AdminApiError, adminRequest } from './adminApi'
import type {
  CheckoutAttemptsPage,
  CheckoutPaidFilter,
} from './checkout-attempts.model'

const path = '/api/admin/standalone-billing/checkout-attempts'
const PAGE_SIZE = 25

interface Result {
  /** The request this result answers; a different key means one is loading. */
  key: string
  page: CheckoutAttemptsPage | null
  error: AdminApiError | null
}

/** Merchants who opened Paymob checkout, newest first, unpaid by default. */
export function useCheckoutAttempts() {
  const [paid, setPaidState] = useState<CheckoutPaidFilter>('unpaid')
  const [offsets, setOffsets] = useState<number[]>([0])
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const offset = offsets.at(-1) ?? 0
  const query = new URLSearchParams({
    paid,
    limit: String(PAGE_SIZE),
    offset: String(offset),
  }).toString()
  const requestKey = `${query}#${revision}`
  const loading = result?.key !== requestKey

  useEffect(() => {
    let current = true
    adminRequest<CheckoutAttemptsPage>(`${path}?${query}`)
      .then((page) => {
        if (current) setResult({ key: requestKey, page, error: null })
      })
      .catch((cause: unknown) => {
        console.error('[Admin] Checkout attempts request failed', cause)
        if (current)
          setResult({
            key: requestKey,
            page: null,
            error:
              cause instanceof AdminApiError
                ? cause
                : new AdminApiError('Request failed', 0, null),
          })
      })
    return () => {
      current = false
    }
  }, [query, requestKey])

  const page = result?.page ?? null
  return {
    paid,
    page,
    loading,
    error: loading ? null : (result?.error ?? null),
    hasPrevious: offsets.length > 1,
    setPaid(next: CheckoutPaidFilter) {
      setOffsets([0])
      setPaidState(next)
    },
    next() {
      if (page?.nextOffset != null)
        setOffsets((current) => [...current, page.nextOffset as number])
    },
    previous() {
      setOffsets((current) =>
        current.length > 1 ? current.slice(0, -1) : current
      )
    },
    refresh() {
      setRevision((value) => value + 1)
    },
  }
}
