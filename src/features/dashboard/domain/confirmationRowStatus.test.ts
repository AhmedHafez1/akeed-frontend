import { describe, expect, it } from 'vitest'
import type { VerificationItem } from '../model/dashboard.model'
import { canSendShippingInfo } from './confirmationRowStatus'

function row(overrides: Partial<VerificationItem>): VerificationItem {
  return {
    status: 'confirmed',
    is_test: false,
    ...overrides,
  } as VerificationItem
}

describe('canSendShippingInfo', () => {
  it('offers shipping details only for real confirmed orders', () => {
    expect(canSendShippingInfo(row({}))).toBe(true)
    expect(canSendShippingInfo(row({ is_test: true }))).toBe(false)
    expect(canSendShippingInfo(row({ status: 'canceled' }))).toBe(false)
    expect(canSendShippingInfo(row({ status: 'no_reply' }))).toBe(false)
  })
})
