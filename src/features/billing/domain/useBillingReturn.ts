'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEmitDomainEvent } from '@/shared/query/domainEvents'
import { fetchPurchase } from '../api/billingApi'
import type { PurchaseDetail } from './billing.types'
import type { ReturnState } from './billingReturnView'
import { forgetReturnTo, readReturnTo } from './billingReturnTo'
import { useBillingSummary } from './useBillingSummary'

const PURCHASE_REFERENCE = /^akd_[a-f0-9]{32}$/
const POLL_INTERVAL_MS = 2000
const MAX_POLL_COUNT = 5

function isTerminal(purchase: PurchaseDetail) {
  return purchase.status !== 'pending' || purchase.reconciliationRequired
}

/**
 * The purchase Paymob sent the merchant back from. It reads the reference
 * from the URL, polls while the payment is pending, stops after a few tries
 * (`stale`) and lets the merchant refresh by hand. A new purchase is never
 * created here.
 */
export function useBillingReturn() {
  const searchParams = useSearchParams()
  const purchaseRef = searchParams.get('purchaseRef') ?? ''
  const isValidReference = PURCHASE_REFERENCE.test(purchaseRef)
  const emitDomainEvent = useEmitDomainEvent()
  const { summary, isFetching, updatedAt } = useBillingSummary()
  const [state, setState] = useState<ReturnState>(
    isValidReference ? { kind: 'loading' } : { kind: 'invalid' }
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [successSeenAt, setSuccessSeenAt] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Read after mount: session storage has no server value to hydrate from.
  const [returnTo, setReturnTo] = useState<string | null>(null)
  useEffect(() => {
    setReturnTo(readReturnTo())
  }, [])
  const runIdRef = useRef(0)

  const load = useCallback(
    async (pollCount = 0, manual = false) => {
      if (!isValidReference) {
        setState({ kind: 'invalid' })
        return
      }
      const runId = ++runIdRef.current
      if (manual) setIsRefreshing(true)
      try {
        const purchase = await fetchPurchase(purchaseRef)
        if (runId !== runIdRef.current) return
        if (isTerminal(purchase)) {
          setState({ kind: 'purchase', purchase })
          if (purchase.status === 'successful') {
            setSuccessSeenAt((seenAt) => seenAt ?? Date.now())
            void emitDomainEvent('credits.purchased')
          }
          return
        }
        if (pollCount >= MAX_POLL_COUNT) {
          setState({ kind: 'stale', purchase })
          return
        }
        setState({ kind: 'purchase', purchase })
        timerRef.current = setTimeout(
          () => void load(pollCount + 1),
          POLL_INTERVAL_MS
        )
      } catch {
        if (runId === runIdRef.current) setState({ kind: 'error' })
      } finally {
        if (manual && runId === runIdRef.current) setIsRefreshing(false)
      }
    },
    [emitDomainEvent, isValidReference, purchaseRef]
  )

  useEffect(() => {
    void load()
    return () => {
      runIdRef.current += 1
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [load])

  const refresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    void load(0, true)
  }, [load])

  /*
   * The purchase itself carries no balance, and the cached summary predates
   * the payment. It counts only once it was read again after success was seen
   * (the domain event above triggers that read); a balance that cannot send
   * is left out, because the sentence it sits in promises confirmations.
   */
  const balance =
    successSeenAt !== null &&
    summary &&
    !isFetching &&
    updatedAt > successSeenAt &&
    summary.status === 'active' &&
    summary.availableCredits > 0
      ? summary.availableCredits
      : null

  return {
    state,
    isRefreshing,
    refresh,
    returnTo,
    forgetReturnTo,
    /** The balance after a successful purchase; `null` until it is known. */
    balance,
  }
}
