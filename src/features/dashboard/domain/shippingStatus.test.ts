import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/lib/http'
import { shippingResolveErrorKey } from '../api/shippingApi'
import type {
  NeedsActionItem,
  ShippingSummary,
  VerificationItem,
} from '../model/dashboard.model'
import { canSendShippingInfo, resolveRowStatus } from './confirmationRowStatus'
import { needsActionRowModel } from './needsActionRow'
import {
  isShippingSent,
  safeTrackingUrl,
  shippingCellView,
  shippingRequestKind,
} from './shippingStatus'

function shipping(overrides: Partial<ShippingSummary> = {}): ShippingSummary {
  return {
    status: 'sent',
    reason_code: null,
    trigger: 'fulfillment',
    matched_tag: null,
    tracking_number: null,
    tracking_url: null,
    customer_reply: null,
    customer_replied_at: null,
    delivery_request: false,
    resolved_at: null,
    updated_at: '2026-11-25T12:20:00Z',
    ...overrides,
  }
}

function row(overrides: Partial<VerificationItem>): VerificationItem {
  return {
    status: 'confirmed',
    is_test: false,
    ...overrides,
  } as VerificationItem
}

describe('shippingCellView', () => {
  it('is blank when nothing was due or the message is still pending', () => {
    expect(shippingCellView(null)).toBeNull()
    expect(shippingCellView(undefined)).toBeNull()
    expect(shippingCellView(shipping({ status: 'pending' }))).toBeNull()
  })

  it.each(['sent', 'delivered', 'read'] as const)(
    'reads %s as Sent',
    (status) => {
      expect(shippingCellView(shipping({ status }))).toEqual({
        badge: 'sent',
        reason: null,
      })
    }
  )

  it.each([
    ['no_phone', 'undeliverable'],
    ['not_on_whatsapp', 'undeliverable'],
    ['send_failed', 'failedToSend'],
    ['template_unavailable', 'failedToSend'],
    ['no_allowance', 'failedToSend'],
    ['order_too_old', 'notSent'],
    ['order_cancelled', 'notSent'],
  ] as const)('words %s as %s, with its reason', (reason, badge) => {
    expect(
      shippingCellView(shipping({ status: 'failed', reason_code: reason }))
    ).toEqual({ badge, reason })
  })

  it('shows a retired or unknown code as a plain failure without a reason', () => {
    expect(
      shippingCellView(
        shipping({ status: 'failed', reason_code: 'allowance_low' })
      )
    ).toEqual({ badge: 'failedToSend', reason: null })
  })
})

describe('shipping helpers', () => {
  it('knows when the Shipped message went out', () => {
    expect(isShippingSent(shipping({ status: 'read' }))).toBe(true)
    expect(isShippingSent(shipping({ status: 'failed' }))).toBe(false)
    expect(isShippingSent(null)).toBe(false)
  })

  it('reads the open request from the reply', () => {
    expect(shippingRequestKind(shipping())).toBeNull()
    expect(
      shippingRequestKind(
        shipping({ delivery_request: true, customer_reply: 'address' })
      )
    ).toBe('address')
    expect(
      shippingRequestKind(
        shipping({ delivery_request: true, customer_reply: 'reschedule' })
      )
    ).toBe('reschedule')
  })

  it('links tracking only over https', () => {
    expect(safeTrackingUrl('https://track.example/1Z')).toBe(
      'https://track.example/1Z'
    )
    expect(safeTrackingUrl('http://track.example/1Z')).toBeNull()
    expect(safeTrackingUrl('javascript:alert(1)')).toBeNull()
    expect(safeTrackingUrl(null)).toBeNull()
  })

  it('treats nothing left to resolve as done, not as an error', () => {
    expect(
      shippingResolveErrorKey(
        new ApiError('x', 409, 'SHIPPING_NOTHING_TO_RESOLVE')
      )
    ).toBeNull()
    expect(
      shippingResolveErrorKey(
        new ApiError('x', 404, 'SHIPPING_NOTIFICATION_NOT_FOUND')
      )
    ).toBe('notFound')
    expect(
      shippingResolveErrorKey(
        new ApiError('x', 403, 'VERIFICATION_ROLE_REQUIRED')
      )
    ).toBe('readOnly')
    expect(shippingResolveErrorKey(new Error('network'))).toBe('generic')
  })
})

describe('the manual "Send shipping info" action', () => {
  it('is hidden once the Shipped message went out automatically', () => {
    expect(canSendShippingInfo(row({}))).toBe(true)
    expect(
      canSendShippingInfo(row({ shipping: shipping({ status: 'sent' }) }))
    ).toBe(false)
    expect(
      canSendShippingInfo(row({ shipping: shipping({ status: 'delivered' }) }))
    ).toBe(false)
  })

  it('stays when the Shipped message did not go out', () => {
    expect(
      canSendShippingInfo(
        row({
          shipping: shipping({ status: 'failed', reason_code: 'send_failed' }),
        })
      )
    ).toBe(true)
    expect(
      canSendShippingInfo(row({ shipping: shipping({ status: 'pending' }) }))
    ).toBe(true)
  })
})

describe('row status after shipping', () => {
  it('shows the customer request in place of Confirmed', () => {
    expect(
      resolveRowStatus(
        row({
          action_reason: 'delivery_request',
          shipping: shipping({
            delivery_request: true,
            customer_reply: 'reschedule',
          }),
        })
      )
    ).toEqual({ badge: 'reschedule', tone: 'warning', kind: 'needsAction' })
    expect(
      resolveRowStatus(
        row({
          action_reason: 'delivery_request',
          shipping: shipping({
            delivery_request: true,
            customer_reply: 'address',
          }),
        })
      ).badge
    ).toBe('changeAddress')
  })

  it('shows an unreached customer as WhatsApp undeliverable', () => {
    expect(
      resolveRowStatus(row({ action_reason: 'shipping_not_reachable' }))
    ).toMatchObject({ badge: 'noWhatsApp', kind: 'noWhatsApp' })
  })
})

describe('needs-action item after shipping', () => {
  const item = (overrides: Partial<NeedsActionItem>): NeedsActionItem =>
    ({
      verification_id: 'v-1',
      order_id: 'order-1',
      order_number: '1187',
      customer_phone: '+201001234567',
      capabilities: ['merchant_manual_confirmation'],
      reason: {
        type: 'delivery_request',
        since: null,
        hours: null,
        failure_code: null,
      },
      ...overrides,
    }) as NeedsActionItem

  it('offers Mark done and a chat for a delivery request, never confirm or cancel', () => {
    const model = needsActionRowModel(
      item({
        shipping: shipping({
          delivery_request: true,
          customer_reply: 'address',
        }),
      }),
      { fallbackPrefix: 'Order', canAct: true }
    )
    expect(model.status).toEqual({
      kind: 'needsAction',
      badge: 'changeAddress',
    })
    expect(model.shipping?.canResolve).toBe(true)
    expect(model.chatUrl).toContain('wa.me')
    expect(model.confirmable).toBe(false)
    expect(model.cancelable).toBe(false)
  })

  it('offers no chat for an unreached customer, and nothing to a viewer', () => {
    const model = needsActionRowModel(
      item({
        reason: {
          type: 'shipping_not_reachable',
          since: null,
          hours: null,
          failure_code: null,
        },
      }),
      { fallbackPrefix: 'Order', canAct: false }
    )
    expect(model.status).toEqual({ kind: 'noWhatsApp', badge: 'noWhatsApp' })
    expect(model.chatUrl).toBeNull()
    expect(model.shipping).toEqual({ canResolve: false, contact: null })
  })
})
