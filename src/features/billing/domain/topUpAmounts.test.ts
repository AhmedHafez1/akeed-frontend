import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSearchParams } from 'next/navigation'
import { CREDIT_PRESETS } from '@/shared/config/pricing'
import { billingPurchaseHref, prefilledAmount } from './billingReturnTo'
import { derivePackages } from './creditPackages'
import { amountRange, useBillingPage } from './useBillingPage'
import { useBillingSummary } from './useBillingSummary'
import { createPurchase } from '../api/billingApi'

vi.mock('next/navigation', () => ({ useSearchParams: vi.fn() }))
vi.mock('./useBillingSummary', () => ({ useBillingSummary: vi.fn() }))
vi.mock('../api/billingApi', () => ({ createPurchase: vi.fn() }))

/** The API's range at the default price: EGP 100 to 5,000 in steps of 50. */
const range = { min: 200, max: 10_000, step: 100 }
const UNIT = 50

describe('amountRange', () => {
  it('states the displayed-credit range in whole pounds', () => {
    expect(amountRange(range, UNIT)).toEqual({ min: 100, max: 5000, step: 50 })
  })
})

describe('derivePackages', () => {
  it('offers EGP 100, 250, 500 and 1,000, priced at the unit price', () => {
    expect(derivePackages(range, UNIT)).toEqual([
      { credits: 200, totalMinor: 10_000 },
      { credits: 500, totalMinor: 25_000 },
      { credits: 1000, totalMinor: 50_000 },
      { credits: 2000, totalMinor: 100_000 },
    ])
    expect(CREDIT_PRESETS).toEqual([200, 500, 1000, 2000])
  })

  it('drops a preset the range would reject', () => {
    expect(
      derivePackages({ min: 600, max: 10_000, step: 100 }, UNIT).map(
        (item) => item.credits
      )
    ).toEqual([1000, 2000])
  })
})

describe('billingPurchaseHref', () => {
  const returnTo = '/imports/0d5c1a0e-6b1f-4f7e-9c33-2b8f1d2e4a10?start=1'

  it('asks for whole pounds, rounded up to cover the shortfall', () => {
    expect(billingPurchaseHref({ amountMinor: 2950, returnTo })).toBe(
      `/billing?amount=30&returnTo=${encodeURIComponent(returnTo)}`
    )
    expect(billingPurchaseHref({ amountMinor: 10_000, returnTo: 'x' })).toBe(
      '/billing?amount=100'
    )
  })
})

describe('prefilledAmount', () => {
  const pounds = amountRange(range, UNIT)

  it('rounds a requested amount up onto the step and into the range', () => {
    expect(prefilledAmount('30', pounds)).toBe(100)
    expect(prefilledAmount('120', pounds)).toBe(150)
    expect(prefilledAmount('250', pounds)).toBe(250)
    expect(prefilledAmount('9000', pounds)).toBe(5000)
  })

  it('ignores anything that is not a whole positive amount', () => {
    for (const raw of [null, '', '0', '-5', '12.5', 'abc'])
      expect(prefilledAmount(raw, pounds)).toBeNull()
  })
})

describe('useBillingPage', () => {
  it('sends 200 displayed credits for EGP 100 and rejects an off-grid amount', async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('amount=100') as ReturnType<typeof useSearchParams>
    )
    vi.mocked(useBillingSummary).mockReturnValue({
      summary: {
        range,
        price: { unitPriceMinor: UNIT },
        billingEnabled: true,
        canPurchase: true,
      },
    } as ReturnType<typeof useBillingSummary>)
    vi.mocked(createPurchase).mockResolvedValue({
      reference: 'test-purchase',
    } as Awaited<ReturnType<typeof createPurchase>>)
    const { result } = renderHook(() => useBillingPage())

    await waitFor(() => expect(result.current.totalMinor).toBe(10_000))
    act(() => result.current.setAmountInput('100.50'))
    expect(result.current.quantityError).toBe('step')
    await act(() => result.current.createCheckout())
    expect(createPurchase).not.toHaveBeenCalled()

    act(() => result.current.setAmountInput('100'))
    await act(() => result.current.createCheckout())
    expect(createPurchase).toHaveBeenCalledOnce()
    expect(createPurchase).toHaveBeenCalledWith(200, expect.any(String))
  })
})
