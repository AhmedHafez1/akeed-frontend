'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BillingApiError, createPurchase } from '../api/billingApi'
import type { CreatePurchaseResponse } from './billing.types'
import { derivePackages } from './creditPackages'
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
  const [quantityInput, setQuantityInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [checkout, setCheckout] = useState<CreatePurchaseResponse | null>(null)
  const [pendingReference, setPendingReference] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (summary && !quantityInput) setQuantityInput(String(summary.range.min))
  }, [quantityInput, summary])

  const quantity = Number(quantityInput)
  const quantityError = useMemo(() => {
    if (!summary) return null
    if (!Number.isInteger(quantity)) return 'whole'
    if (quantity < summary.range.min || quantity > summary.range.max)
      return 'range'
    if (quantity % summary.range.step !== 0) return 'step'
    return null
  }, [quantity, summary])

  const packages = useMemo(
    () =>
      summary
        ? derivePackages(summary.range, summary.price.unitPriceMinor)
        : [],
    [summary]
  )

  /*
   * Presets and the stepper are two views of one value, not two pieces of
   * state. Typing an amount that is not a preset simply leaves nothing
   * selected, which is why this is derived rather than stored.
   */
  const selectedPackage = useMemo(
    () => packages.find((item) => item.credits === quantity)?.credits ?? null,
    [packages, quantity]
  )

  const totalMinor =
    summary && Number.isFinite(quantity)
      ? quantity * summary.price.unitPriceMinor
      : 0

  const adjustQuantity = useCallback(
    (direction: -1 | 1) => {
      if (!summary) return
      const { min, max, step } = summary.range
      const base = Number.isInteger(quantity) ? quantity : min
      /*
       * Snap onto the step grid before moving, so stepping away from a
       * hand-typed amount lands on a quantity the server will actually price
       * instead of carrying the offset forward.
       */
      const grid =
        direction > 0
          ? Math.floor(base / step) * step
          : Math.ceil(base / step) * step
      const next = Math.min(max, Math.max(min, grid + direction * step))
      setQuantityInput(String(next))
    },
    [quantity, summary]
  )

  const selectPackage = useCallback((credits: number) => {
    setQuantityInput(String(credits))
  }, [])

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

  /** A checkout in flight freezes the amount it was priced for. */
  const isLocked = !!checkout || !!pendingReference
  const canPurchase = !!summary?.canPurchase && !!summary?.billingEnabled

  return {
    summary,
    isSummaryLoading,
    summaryError: error,
    refreshSummary: refresh,
    packages,
    selectedPackage,
    selectPackage,
    quantityInput,
    setQuantityInput,
    quantity,
    quantityError,
    totalMinor,
    adjustQuantity,
    canPurchase,
    isLocked,
    isCreating,
    checkout,
    pendingReference,
    checkoutError,
    createCheckout,
    startNewPurchase,
  }
}
