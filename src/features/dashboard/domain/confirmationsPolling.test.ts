import { describe, expect, it } from 'vitest'
import type { VerificationItem } from '../model/dashboard.model'
import {
  AWAITING_POLL_INTERVAL_MS,
  SHIPPING_REPLY_POLL_INTERVAL_MS,
  confirmationsPollInterval,
} from './confirmationsPolling'

const NOW = Date.parse('2026-11-27T12:00:00Z')

function row(overrides: Partial<VerificationItem>): VerificationItem {
  return {
    status: 'confirmed',
    shipping: null,
    ...overrides,
  } as VerificationItem
}

function shipped(
  over: Partial<NonNullable<VerificationItem['shipping']>>
): VerificationItem {
  return row({
    shipping: {
      status: 'read',
      customer_reply: null,
      updated_at: '2026-11-27T09:00:00Z',
      ...over,
    } as VerificationItem['shipping'],
  })
}

describe('confirmationsPollInterval', () => {
  it('polls every 30 s while a confirmation reply is awaited', () => {
    expect(
      confirmationsPollInterval([row({ status: 'read' }), shipped({})], NOW)
    ).toBe(AWAITING_POLL_INTERVAL_MS)
  })

  it('polls every minute while a recent Shipped message has no reply', () => {
    expect(confirmationsPollInterval([row({}), shipped({})], NOW)).toBe(
      SHIPPING_REPLY_POLL_INTERVAL_MS
    )
  })

  it('stops once the reply came, the message is a day old, or it never went out', () => {
    expect(
      confirmationsPollInterval([shipped({ customer_reply: 'home' })], NOW)
    ).toBe(false)
    expect(
      confirmationsPollInterval(
        [shipped({ updated_at: '2026-11-26T11:00:00Z' })],
        NOW
      )
    ).toBe(false)
    expect(
      confirmationsPollInterval([shipped({ status: 'failed' })], NOW)
    ).toBe(false)
    expect(confirmationsPollInterval([row({})], NOW)).toBe(false)
  })
})
