import { describe, expect, it } from 'vitest'
import type { PurchaseDetail } from './billing.types'
import { resolveReturnView } from './billingReturnView'

function purchase(overrides: Partial<PurchaseDetail> = {}): PurchaseDetail {
  return {
    reference: 'akd_0123456789abcdef0123456789abcdef',
    status: 'successful',
    disputeStatus: 'none',
    quantity: 500,
    unitPriceMinor: 200,
    totalMinor: 100_000,
    currency: 'EGP',
    refundedMinor: 0,
    reconciliationRequired: false,
    checkoutExpiresAt: null,
    createdAt: '2026-10-01T05:50:00.000Z',
    updatedAt: '2026-10-01T05:52:00.000Z',
    ...overrides,
  }
}

const settled = (overrides: Partial<PurchaseDetail> = {}) =>
  ({ kind: 'purchase', purchase: purchase(overrides) }) as const

describe('resolveReturnView', () => {
  it('continues the import after success only when one is waiting', () => {
    expect(resolveReturnView(settled(), true)).toMatchObject({
      look: 'success',
      copy: 'successful',
      primary: 'continueImport',
    })
    expect(resolveReturnView(settled(), false).primary).toBeNull()
  })

  it('offers a refresh while the payment is pending', () => {
    expect(
      resolveReturnView(settled({ status: 'pending' }), true)
    ).toMatchObject({ look: 'pending', copy: 'pending', primary: 'refresh' })
  })

  it('keeps the pending look once polling gave up, under its own copy', () => {
    const state = {
      kind: 'stale',
      purchase: purchase({ status: 'pending' }),
    } as const
    expect(resolveReturnView(state, false)).toMatchObject({
      look: 'pending',
      copy: 'stale',
      primary: 'refresh',
    })
  })

  it.each(['failed', 'expired', 'canceled'] as const)(
    'offers a new purchase after a %s payment',
    (status) => {
      expect(resolveReturnView(settled({ status }), true)).toMatchObject({
        look: status,
        copy: status,
        primary: 'newPurchase',
      })
    }
  )

  it('has nothing to offer after a refund', () => {
    expect(
      resolveReturnView(settled({ status: 'refunded' }), true)
    ).toMatchObject({ look: 'refunded', copy: 'refunded', primary: null })
  })

  it('puts a payment under review ahead of its status', () => {
    expect(
      resolveReturnView(
        settled({ status: 'failed', reconciliationRequired: true }),
        false
      )
    ).toMatchObject({ look: 'review', copy: 'reconciliation', primary: null })
    // Still pending: the merchant can ask again, as before.
    expect(
      resolveReturnView(
        settled({ status: 'pending', reconciliationRequired: true }),
        false
      ).primary
    ).toBe('refresh')
  })

  it('shows no purchase for a bad reference or a failed read', () => {
    expect(resolveReturnView({ kind: 'invalid' }, true)).toEqual({
      look: 'problem',
      copy: 'invalid',
      primary: null,
      purchase: null,
    })
    expect(resolveReturnView({ kind: 'error' }, true)).toEqual({
      look: 'problem',
      copy: 'error',
      primary: 'refresh',
      purchase: null,
    })
  })
})
