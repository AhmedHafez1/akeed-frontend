import { describe, expect, it } from 'vitest'
import type {
  NeedsActionItem,
  VerificationItem,
} from '../model/dashboard.model'
import { resolveRowStatus } from './confirmationRowStatus'
import { planConfirmationRowActions } from './confirmationRowActions'
import { needsActionRowModel } from './needsActionRow'
import { filterAdmitsStatus } from './verificationFilters'
import { canMarkOrderCanceled } from './verificationLifecycle'
import { getStatusTimestamp, resolveRowDescriptionKey } from './verificationRow'

/** A customer number that is not on WhatsApp: the merchant calls instead. */
function row(overrides: Partial<VerificationItem> = {}): VerificationItem {
  return {
    id: 'v1',
    status: 'no_whatsapp',
    reason: null,
    is_test: false,
    action_reason: 'no_whatsapp',
    failure_code: '131026',
    no_whatsapp_at: '2026-10-14T09:30:00Z',
    capabilities: [
      { action: 'merchant_manual_confirmation', supported: true },
      { action: 'merchant_no_reply_cancellation', supported: true },
      { action: 'retry_verification', supported: false },
    ],
    ...overrides,
  } as VerificationItem
}

describe('a No WhatsApp row', () => {
  it('wears its own badge with the call hint as the sub-line', () => {
    expect(resolveRowStatus(row())).toEqual({
      badge: 'noWhatsApp',
      tone: 'warning',
      kind: 'noWhatsApp',
      sub: 'sub.callCustomer',
    })
  })

  it('dates the status from when WhatsApp reported the number', () => {
    expect(getStatusTimestamp(row())).toBe('2026-10-14T09:30:00Z')
  })

  it('tells the merchant to call in the details', () => {
    expect(resolveRowDescriptionKey(row())).toBe('descriptions.no_whatsapp')
    // A leftover reason never hides the advice.
    expect(
      resolveRowDescriptionKey(row({ reason: 'provider_delivery_failed' }))
    ).toBe('descriptions.no_whatsapp')
  })

  it('offers manual confirm and cancel, no chat and no retry', () => {
    expect(
      planConfirmationRowActions(row(), { canWrite: true, canRetry: true })
    ).toEqual({
      primary: null,
      canConfirm: true,
      canRetry: false,
      canCancel: true,
      autoCancelToggle: null,
    })
    expect(
      canMarkOrderCanceled('no_whatsapp', 'no_whatsapp', row().capabilities)
    ).toBe(true)
  })

  it('is filed under needs attention, never under awaiting reply', () => {
    expect(filterAdmitsStatus('no_whatsapp', 'no_whatsapp')).toBe(true)
    expect(filterAdmitsStatus('needs_attention', 'no_whatsapp')).toBe(true)
    expect(filterAdmitsStatus('awaiting_response', 'no_whatsapp')).toBe(false)
    expect(filterAdmitsStatus('in_progress', 'no_whatsapp')).toBe(false)
  })

  it('reads in the needs-action card without a chat link', () => {
    const item = {
      verification_id: 'v1',
      order_id: 'order-uuid-1234',
      order_number: '1138',
      customer_phone: '+201007611456',
      reason: {
        type: 'no_whatsapp',
        since: '2026-10-14T09:30:00Z',
        hours: 1,
        failure_code: '131026',
      },
      capabilities: row().capabilities,
    } as NeedsActionItem
    expect(
      needsActionRowModel(item, { fallbackPrefix: 'Order', canAct: true })
    ).toEqual({
      orderLabel: '#1138',
      status: { kind: 'noWhatsApp', badge: 'noWhatsApp' },
      chatUrl: null,
      confirmable: true,
      cancelable: true,
    })
  })
})
