'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BillingApiError,
  createPurchase,
  fetchLedger,
  fetchPurchases,
} from '../api/billingApi'
import type {
  CreatePurchaseResponse,
  LedgerEntry,
  PurchaseSummary,
} from './billing.types'
import { useBillingSummary } from './BillingProvider'

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
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [purchaseCursor, setPurchaseCursor] = useState<string | null>(null)
  const [ledgerCursor, setLedgerCursor] = useState<string | null>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)
  const [quantityInput, setQuantityInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [checkout, setCheckout] = useState<CreatePurchaseResponse | null>(null)
  const [pendingReference, setPendingReference] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (summary && !quantityInput) setQuantityInput(String(summary.range.min))
  }, [quantityInput, summary])

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true)
    setHistoryError(false)
    try {
      const [purchasePage, ledgerPage] = await Promise.all([
        fetchPurchases(),
        fetchLedger(),
      ])
      setPurchases(purchasePage.items)
      setPurchaseCursor(purchasePage.nextCursor)
      setLedger(ledgerPage.items)
      setLedgerCursor(ledgerPage.nextCursor)
    } catch {
      setHistoryError(true)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

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

  const loadMorePurchases = useCallback(async () => {
    if (!purchaseCursor) return
    const page = await fetchPurchases(purchaseCursor)
    setPurchases((current) => [...current, ...page.items])
    setPurchaseCursor(page.nextCursor)
  }, [purchaseCursor])

  const loadMoreLedger = useCallback(async () => {
    if (!ledgerCursor) return
    const page = await fetchLedger(ledgerCursor)
    setLedger((current) => [...current, ...page.items])
    setLedgerCursor(page.nextCursor)
  }, [ledgerCursor])

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
