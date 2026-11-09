import { describe, expect, it } from 'vitest'
import type {
  ChangeRequestSummary,
  NeedsActionItem,
  VerificationItem,
} from '../model/dashboard.model'
import { customerContact } from '../lib/customerContact'
import {
  changeRequestAckView,
  isAckMissing,
  isResendBusy,
  resendView,
} from './changeRequestView'
import { planConfirmationRowActions } from './confirmationRowActions'
import { resolveRowStatus } from './confirmationRowStatus'
import { resolveConfirmationsTab } from './confirmationsUrlState'
import { needsActionRowModel } from './needsActionRow'

function summary(
  overrides: Partial<ChangeRequestSummary> = {}
): ChangeRequestSummary {
  return {
    id: 'cr-1',
    opened_at: '2026-11-08T10:00:00.000Z',
    confirmation_cycle: 1,
    acknowledgment: { status: 'done', reason: null },
    reconfirmation: { state: null, scheduled_for: null, last_error: null },
    ...overrides,
  }
}

function needsActionItem(
  overrides: Partial<NeedsActionItem> = {}
): NeedsActionItem {
  return {
    verification_id: 'ver-1',
    order_id: 'order-1',
    external_order_id: '1187',
    platform: 'easyorders',
    order_number: '1187',
    customer_name: 'Mona',
    customer_phone: '+201001234567',
    total_price: '1240.00',
    currency: 'EGP',
    reason: {
      type: 'change_requested',
      since: '2026-11-08T10:00:00.000Z',
      hours: 2,
      failure_code: null,
    },
    capabilities: [{ action: 'merchant_manual_confirmation', supported: true }],
    change_request: summary(),
    ...overrides,
  }
}

function listRow(overrides: Partial<VerificationItem> = {}): VerificationItem {
  return {
    id: 'ver-1',
    status: 'read',
    reason: null,
    order_id: 'order-1',
    order_number: '1187',
    is_test: false,
    customer_name: 'Mona',
    customer_phone: '+201001234567',
    total_price: '1240.00',
    currency: 'EGP',
    created_at: null,
    last_sent_at: null,
    delivered_at: null,
    read_at: null,
    confirmed_at: null,
    canceled_at: null,
    expired_at: null,
    no_reply_at: null,
    follow_up_attempts: 0,
    follow_up_sent_at: null,
    action_reason: 'change_requested',
    capabilities: [
      { action: 'merchant_manual_confirmation', supported: true },
      { action: 'merchant_no_reply_cancellation', supported: true },
    ],
    change_request: summary(),
    ...overrides,
  } as VerificationItem
}

describe('change request view', () => {
  it.each([
    [{ status: 'done', reason: null }, 'sent'],
    [{ status: 'skipped', reason: 'skipped_no_allowance' }, 'skipped'],
    [{ status: 'failed', reason: 'provider' }, 'failed'],
    [{ status: 'pending', reason: null }, 'pending'],
    [null, 'pending'],
  ] as const)('reads the acknowledgment %j as %s', (acknowledgment, view) => {
    expect(changeRequestAckView({ acknowledgment })).toBe(view)
  })

  it('warns only when the customer was not told', () => {
    expect(isAckMissing(summary())).toBe(false)
    expect(
      isAckMissing(
        summary({ acknowledgment: { status: 'skipped', reason: null } })
      )
    ).toBe(true)
  })

  it.each([
    [{ state: 'requested' }, { kind: 'queued' }],
    [{ state: 'sending' }, { kind: 'queued' }],
    [
      { state: 'scheduled', scheduled_for: '2026-11-09T07:00:00.000Z' },
      { kind: 'scheduled', at: '2026-11-09T07:00:00.000Z' },
    ],
    [
      { state: 'failed', last_error: 'order_source_unavailable' },
      { kind: 'failed', reason: 'store', retryable: true },
    ],
    [
      { state: 'failed', last_error: 'order_not_found' },
      { kind: 'failed', reason: 'store', retryable: false },
    ],
    [
      { state: 'failed', last_error: 'no_allowance' },
      { kind: 'failed', reason: 'balance', retryable: true },
    ],
    [
      { state: 'failed', last_error: 'provider_outcome_unknown' },
      { kind: 'failed', reason: 'send', retryable: true },
    ],
    [{ state: null }, { kind: 'idle' }],
  ] as const)('reads the resend %j', (reconfirmation, expected) => {
    const view = resendView({
      reconfirmation: {
        scheduled_for: null,
        last_error: null,
        ...reconfirmation,
      },
    })
    expect(view).toEqual(expected)
  })

  it('treats a queued or waiting resend as busy', () => {
    expect(isResendBusy({ kind: 'queued' })).toBe(true)
    expect(isResendBusy({ kind: 'scheduled', at: null })).toBe(true)
    expect(
      isResendBusy({ kind: 'failed', reason: 'send', retryable: true })
    ).toBe(false)
  })
})

describe('customer contact', () => {
  it('builds WhatsApp, call and copy from the stored number', () => {
    expect(customerContact('+20 100 123 4567')).toEqual({
      whatsAppUrl: 'https://wa.me/201001234567',
      callUrl: 'tel:+201001234567',
      copyText: '+201001234567',
    })
  })

  it.each([null, '', '12345'])('gives nothing for %j', (phone) => {
    expect(customerContact(phone)).toBeNull()
  })
})

describe('a change-request row', () => {
  it('needs action as "change requested", handled from its details', () => {
    const row = needsActionRowModel(needsActionItem(), {
      fallbackPrefix: 'Order',
      canAct: true,
    })
    expect(row.status).toEqual({
      kind: 'needsAction',
      badge: 'changeRequested',
    })
    expect(row.confirmable).toBe(false)
    expect(row.cancelable).toBe(false)
    expect(row.changeRequest?.contact?.callUrl).toBe('tel:+201001234567')
    expect(row.changeRequest?.ackMissing).toBe(false)
  })

  it('flags a customer who was not told, and a missing phone', () => {
    const row = needsActionRowModel(
      needsActionItem({
        customer_phone: null,
        change_request: summary({
          acknowledgment: { status: 'skipped', reason: 'skipped_no_allowance' },
        }),
      }),
      { fallbackPrefix: 'Order', canAct: true }
    )
    expect(row.changeRequest).toEqual({ ackMissing: true, contact: null })
    expect(row.chatUrl).toBeNull()
  })

  it('offers only "Handle request" in the list, never the plain confirm or cancel', () => {
    const plan = planConfirmationRowActions(listRow(), {
      canWrite: true,
      canRetry: true,
    })
    expect(plan).toMatchObject({
      handle: true,
      canConfirm: false,
      canCancel: false,
      canRetry: false,
      autoCancelToggle: null,
    })
    expect(
      planConfirmationRowActions(listRow({ change_request: null }), {
        canWrite: true,
        canRetry: true,
      }).handle
    ).toBe(false)
  })

  it('wears "change requested" over the awaiting status', () => {
    expect(resolveRowStatus(listRow())).toMatchObject({
      badge: 'changeRequested',
      kind: 'needsAction',
    })
  })

  it('has its own confirmations tab in the URL', () => {
    expect(resolveConfirmationsTab('change_requested')).toBe('change_requested')
  })
})
