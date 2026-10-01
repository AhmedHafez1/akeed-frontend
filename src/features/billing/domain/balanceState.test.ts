import { describe, expect, it } from 'vitest'
import { purchaseBlock, resolveBalanceState } from './balanceState'

const base = {
  status: 'active' as const,
  debtCredits: 0,
  availableCredits: 388,
  lowBalanceThreshold: 50,
}

describe('resolveBalanceState', () => {
  it('is healthy above the low-balance threshold', () => {
    expect(resolveBalanceState(base)).toEqual({
      state: 'healthy',
      tone: 'brand',
    })
  })

  it('warns at and below the threshold', () => {
    for (const availableCredits of [50, 42, 1]) {
      expect(resolveBalanceState({ ...base, availableCredits })).toEqual({
        state: 'low',
        tone: 'warning',
      })
    }
  })

  it('is a danger at zero', () => {
    expect(resolveBalanceState({ ...base, availableCredits: 0 })).toEqual({
      state: 'zero',
      tone: 'danger',
    })
  })

  it('puts debt ahead of an empty balance', () => {
    expect(
      resolveBalanceState({ ...base, availableCredits: 0, debtCredits: 12 })
    ).toEqual({ state: 'debt', tone: 'danger' })
  })

  it('puts an unprovisioned account ahead of debt and balance', () => {
    expect(
      resolveBalanceState({
        ...base,
        status: 'not_provisioned',
        availableCredits: 0,
        debtCredits: 3,
      })
    ).toEqual({ state: 'notProvisioned', tone: 'danger' })
  })

  it('puts suspension first, even with a low balance or debt', () => {
    expect(
      resolveBalanceState({ ...base, status: 'suspended', availableCredits: 4 })
    ).toEqual({ state: 'suspended', tone: 'danger' })
    expect(
      resolveBalanceState({ ...base, status: 'suspended', debtCredits: 9 })
    ).toEqual({ state: 'suspended', tone: 'danger' })
  })
})

describe('purchaseBlock', () => {
  const account = {
    billingEnabled: true,
    canPurchase: true,
    status: 'active' as const,
  }

  it('does not block a member who can purchase', () => {
    expect(purchaseBlock(account)).toBeNull()
  })

  it('reports billing switched off before anything else', () => {
    expect(purchaseBlock({ ...account, billingEnabled: false })).toBe(
      'disabled'
    )
  })

  it('names the account state when that is what blocks the purchase', () => {
    expect(
      purchaseBlock({ ...account, canPurchase: false, status: 'suspended' })
    ).toBe('suspended')
    expect(
      purchaseBlock({
        ...account,
        canPurchase: false,
        status: 'not_provisioned',
      })
    ).toBe('notProvisioned')
  })

  it('falls back to read-only access on an active account', () => {
    expect(purchaseBlock({ ...account, canPurchase: false })).toBe('readOnly')
  })
})
