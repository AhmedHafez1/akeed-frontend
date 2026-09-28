import { describe, expect, it } from 'vitest'
import type { VerificationItem } from '../model/dashboard.model'
import { canSendShippingInfo, resolveRowStatus } from './confirmationRowStatus'

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

describe('resolveRowStatus kind', () => {
  it('maps every status onto one of the standalone badge styles', () => {
    expect(resolveRowStatus(row({})).kind).toBe('confirmed')
    expect(resolveRowStatus(row({ status: 'canceled' })).kind).toBe('canceled')
    expect(resolveRowStatus(row({ status: 'failed' })).kind).toBe('failed')
    expect(resolveRowStatus(row({ status: 'pending' })).kind).toBe('pending')
    expect(
      resolveRowStatus(
        row({ status: 'pending', scheduled_for: '2026-09-27T10:00:00Z' })
      ).kind
    ).toBe('scheduled')
    expect(resolveRowStatus(row({ status: 'not_started' })).kind).toBe(
      'scheduled'
    )
    expect(resolveRowStatus(row({ status: 'no_reply' })).kind).toBe(
      'needsAction'
    )
    expect(resolveRowStatus(row({ status: 'delivered' })).kind).toBe('pending')
  })
})
