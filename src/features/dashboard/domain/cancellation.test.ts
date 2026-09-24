import { describe, expect, it } from 'vitest'
import type { VerificationItem } from '../model/dashboard.model'
import { canCancelOrder, cancellationMessageKey } from './cancellation'

const supported = [
  { action: 'merchant_no_reply_cancellation' as const, supported: true },
]
const unsupported = [
  { action: 'merchant_no_reply_cancellation' as const, supported: false },
]

function row(overrides: Partial<VerificationItem>): VerificationItem {
  return {
    status: 'read',
    action_reason: null,
    capabilities: supported,
    ...overrides,
  } as VerificationItem
}

describe('canCancelOrder', () => {
  it('offers cancel once the customer has gone unanswered', () => {
    expect(canCancelOrder(row({ status: 'no_reply' }))).toBe(true)
    expect(
      canCancelOrder(row({ action_reason: 'no_reply_after_follow_up' }))
    ).toBe(true)
    expect(canCancelOrder(row({ action_reason: 'read_no_reply' }))).toBe(true)
  })

  it('holds cancel back while waiting, after a delivery failure, or when the source cannot', () => {
    expect(canCancelOrder(row({}))).toBe(false)
    expect(
      canCancelOrder(
        row({ status: 'failed', action_reason: 'delivery_failed' })
      )
    ).toBe(false)
    expect(
      canCancelOrder(
        row({ action_reason: 'read_no_reply', capabilities: unsupported })
      )
    ).toBe(false)
  })
})

describe('cancellationMessageKey', () => {
  it('explains an unsupported source for any unanswered row', () => {
    expect(
      cancellationMessageKey(
        row({ action_reason: 'read_no_reply', capabilities: unsupported })
      )
    ).toBe('cancelOrderUnsupported')
    expect(
      cancellationMessageKey(row({ capabilities: unsupported }))
    ).toBeUndefined()
  })
})
