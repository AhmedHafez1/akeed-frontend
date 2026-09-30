import { describe, expect, it } from 'vitest'
import type { NeedsActionItem } from '../model/dashboard.model'
import { needsActionRowModel } from './needsActionRow'

function item(overrides: Partial<NeedsActionItem> = {}): NeedsActionItem {
  return {
    verification_id: 'v-1',
    order_id: 'order-uuid-1234',
    external_order_id: null,
    platform: null,
    order_number: '1138',
    customer_name: 'Ahmed',
    customer_phone: '+201007611456',
    total_price: '100',
    currency: 'EGP',
    reason: {
      type: 'no_reply',
      since: '2026-09-29T10:00:00Z',
      hours: 24,
      failure_code: null,
    },
    capabilities: [
      { action: 'merchant_manual_confirmation', supported: true },
      { action: 'merchant_no_reply_cancellation', supported: true },
    ],
    ...overrides,
  } as NeedsActionItem
}

const options = { fallbackPrefix: 'Order', canAct: true }

describe('needsActionRowModel', () => {
  it('reads an unanswered order as "No reply" with chat, confirm and cancel', () => {
    expect(needsActionRowModel(item(), options)).toEqual({
      orderLabel: '#1138',
      status: { kind: 'needsAction', badge: 'noReply' },
      chatUrl: 'https://wa.me/201007611456',
      confirmable: true,
      cancelable: true,
    })
  })

  it('reads a failed delivery as "Failed to send" with no chat to continue', () => {
    const model = needsActionRowModel(
      item({
        reason: {
          type: 'delivery_failed',
          since: null,
          hours: null,
          failure_code: '131026',
        },
      }),
      options
    )
    expect(model.status).toEqual({ kind: 'failed', badge: 'failed' })
    expect(model.chatUrl).toBeNull()
    expect(model.cancelable).toBe(false)
  })

  it('reads a message that never went out the same way', () => {
    const model = needsActionRowModel(
      item({
        reason: {
          type: 'send_failed',
          since: '2026-09-29T10:00:00Z',
          hours: 24,
          failure_code: null,
        },
      }),
      options
    )
    expect(model.status).toEqual({ kind: 'failed', badge: 'failed' })
    expect(model.chatUrl).toBeNull()
    expect(model.cancelable).toBe(false)
  })

  it('offers viewers nothing to change and falls back to the order id', () => {
    const model = needsActionRowModel(item({ order_number: null }), {
      ...options,
      canAct: false,
    })
    expect(model.orderLabel).toBe('Order order-uu')
    expect(model.confirmable).toBe(false)
    expect(model.cancelable).toBe(false)
  })
})
