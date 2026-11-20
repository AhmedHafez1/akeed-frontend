'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BillingApiError, createPurchase } from '../api/billingApi'
import type { CreatePurchaseResponse } from './billing.types'
import { creditsToMinor } from '@/shared/lib/balanceMoney'
import { prefilledAmount, rememberReturnTo } from './billingReturnTo'
import { derivePackages } from './creditPackages'
import { useBillingSummary } from './useBillingSummary'

function newIdempotencyKey() {
  return crypto.randomUUID()
}

/**
 * The purchase range in pounds. The API states it in displayed credits
 * at `unitPriceMinor` each; at the default price that is EGP 100 to 5,000 in
 * steps of 50.
 */
export function amountRange(
  range: { min: number; max: number; step: number },
  unitPriceMinor: number
) {
  const pounds = (credits: number) => (credits * unitPriceMinor) / 100
  return {
    min: pounds(range.min),
    max: pounds(range.max),
    step: pounds(range.step),
  }
}

export function useBillingPage() {
  const {
    summary,
    isLoading: isSummaryLoading,
    error,
    refresh,
  } = useBillingSummary()
  /** The amount the merchant pays, in pounds, as typed. */
  const [amountInput, setAmountInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [checkout, setCheckout] = useState<CreatePurchaseResponse | null>(null)
  const [pendingReference, setPendingReference] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const idempotencyKeyRef = useRef<string | null>(null)
  const searchParams = useSearchParams()
  const requestedAmount = searchParams.get('amount')
  const requestedCredits = searchParams.get('credits')
  const returnTo = searchParams.get('returnTo')

  // Another screen may ask for an amount (its shortfall) and a way back.
  useEffect(() => {
    rememberReturnTo(returnTo)
  }, [returnTo])

  const range = useMemo(
    () =>
      summary ? amountRange(summary.range, summary.price.unitPriceMinor) : null,
    [summary]
  )

  useEffect(() => {
    if (!range || !summary || amountInput) return
    const legacyAmount =
      requestedCredits && /^\d{1,7}$/.test(requestedCredits)
        ? String(
            Math.ceil(
              creditsToMinor(
                Number(requestedCredits),
                summary.price.unitPriceMinor
              ) / 100
            )
          )
        : null
    setAmountInput(
      String(
        prefilledAmount(requestedAmount ?? legacyAmount, range) ?? range.min
      )
    )
  }, [amountInput, range, requestedAmount, requestedCredits, summary])

  const normalizedInput = amountInput.trim().replace(',', '.')
  const amountMinor = /^\d+(?:\.\d{1,2})?$/.test(normalizedInput)
    ? Math.round(Number(normalizedInput) * 100)
    : null
  const quantityError = useMemo(() => {
    if (!range) return null
    if (amountMinor === null || !Number.isSafeInteger(amountMinor))
      return 'whole'
    if (
      amountMinor < Math.round(range.min * 100) ||
      amountMinor > Math.round(range.max * 100)
    )
      return 'range'
    if (amountMinor % Math.round(range.step * 100) !== 0) return 'step'
    return null
  }, [amountMinor, range])
  /** What the purchase API takes: displayed credits, always even. */
  const quantity =
    summary && amountMinor !== null && !quantityError
      ? amountMinor / summary.price.unitPriceMinor
      : 0

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

  const totalMinor = Number.isSafeInteger(amountMinor) ? (amountMinor ?? 0) : 0

  const adjustQuantity = useCallback(
    (direction: -1 | 1) => {
      if (!range) return
      const min = Math.round(range.min * 100)
      const max = Math.round(range.max * 100)
      const step = Math.round(range.step * 100)
      const base = amountMinor ?? min
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
      setAmountInput(String(next / 100))
    },
    [amountMinor, range]
  )

  const selectPackage = useCallback(
    (credits: number) => {
      if (!summary) return
      setAmountInput(String((credits * summary.price.unitPriceMinor) / 100))
    },
    [summary]
  )

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
      } else if (
        cause instanceof BillingApiError &&
        cause.code === 'BILLING_CLIENT_REFRESH_REQUIRED'
      ) {
        setCheckoutError('refresh')
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
    if (range) setAmountInput(String(range.min))
  }, [range])

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
    amountInput,
    setAmountInput,
    amountRange: range,
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
