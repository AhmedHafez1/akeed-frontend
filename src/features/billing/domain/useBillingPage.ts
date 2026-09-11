'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { BillingApiError, createPurchase } from '../api/billingApi'
import {
  ledgerInfiniteOptions,
  purchasesInfiniteOptions,
} from '../api/billingQueries'
import type { CreatePurchaseResponse } from './billing.types'
import { useBillingSummary } from './useBillingSummary'

function newIdempotencyKey() {
  return crypto.randomUUID()
}

export function useBillingPage() {
  const {
    summary,
    isLoading: isSummaryLoading,
    error,
    refresh,
  } = useBillingSummary()
  const purchasesQuery = useInfiniteQuery(purchasesInfiniteOptions())
  const ledgerQuery = useInfiniteQuery(ledgerInfiniteOptions())
  const [quantityInput, setQuantityInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [checkout, setCheckout] = useState<CreatePurchaseResponse | null>(null)
  const [pendingReference, setPendingReference] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (summary && !quantityInput) setQuantityInput(String(summary.range.min))
  }, [quantityInput, summary])

  const purchases = useMemo(
    () => purchasesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [purchasesQuery.data]
  )
  const ledger = useMemo(
    () => ledgerQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [ledgerQuery.data]
  )
  const purchaseCursor = purchasesQuery.data?.pages.at(-1)?.nextCursor ?? null
  const ledgerCursor = ledgerQuery.data?.pages.at(-1)?.nextCursor ?? null
  const isHistoryLoading = purchasesQuery.isPending || ledgerQuery.isPending
  // History already on screen survives a failed background refresh.
  const historyError =
    (purchasesQuery.isError && purchasesQuery.data === undefined) ||
    (ledgerQuery.isError && ledgerQuery.data === undefined)

  const { refetch: refetchPurchases } = purchasesQuery
  const { refetch: refetchLedger } = ledgerQuery
  const loadHistory = useCallback(async () => {
    await Promise.all([refetchPurchases(), refetchLedger()])
  }, [refetchLedger, refetchPurchases])

  const quantity = Number(quantityInput)
  const quantityError = useMemo(() => {
    if (!summary) return null
    if (!Number.isInteger(quantity)) return 'whole'
    if (quantity < summary.range.min || quantity > summary.range.max)
      return 'range'
    if (quantity % summary.range.step !== 0) return 'step'
    return null
  }, [quantity, summary])

  const createCheckout = useCallback(async () => {
    if (!summary || quantityError || isCreating) return
    idempotencyKeyRef.current ??= newIdempotencyKey()
    setIsCreating(true)
    setCheckoutError(null)
    try {
      const response = await createPurchase(quantity, idempotencyKeyRef.current)
      if (response.checkoutUrl) setCheckout(response)
      else setPendingReference(response.reference)
    } catch (cause) {
      if (cause instanceof BillingApiError && cause.reference) {
        setPendingReference(cause.reference)
      } else {
        setCheckoutError(cause instanceof BillingApiError ? 'api' : 'network')
      }
    } finally {
      setIsCreating(false)
    }
  }, [isCreating, quantity, quantityError, summary])

  const startNewPurchase = useCallback(() => {
    idempotencyKeyRef.current = newIdempotencyKey()
    setCheckout(null)
    setPendingReference(null)
    setCheckoutError(null)
    if (summary) setQuantityInput(String(summary.range.min))
  }, [summary])

  const { fetchNextPage: fetchNextPurchases, hasNextPage: hasMorePurchases } =
    purchasesQuery
  const loadMorePurchases = useCallback(async () => {
    if (!hasMorePurchases) return
    await fetchNextPurchases()
  }, [fetchNextPurchases, hasMorePurchases])

  const { fetchNextPage: fetchNextLedger, hasNextPage: hasMoreLedger } =
    ledgerQuery
  const loadMoreLedger = useCallback(async () => {
    if (!hasMoreLedger) return
    await fetchNextLedger()
  }, [fetchNextLedger, hasMoreLedger])

  return {
    summary,
    isSummaryLoading,
    summaryError: error,
    refreshSummary: refresh,
    purchases,
    ledger,
    purchaseCursor,
    ledgerCursor,
    isHistoryLoading,
    historyError,
    reloadHistory: loadHistory,
    loadMorePurchases,
    loadMoreLedger,
    quantityInput,
    setQuantityInput,
    quantity,
    quantityError,
    isCreating,
    checkout,
    pendingReference,
    checkoutError,
    createCheckout,
    startNewPurchase,
  }
}
