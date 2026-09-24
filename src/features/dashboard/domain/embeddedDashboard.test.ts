import { describe, expect, it } from 'vitest'
import type { VerificationItem } from '../model/dashboard.model'
import { isNeedsActionRow, resolveRowStatus } from './confirmationRowStatus'
import {
  FIRST_PAGE,
  currentCursor,
  nextPage,
  pageRange,
  previousPage,
} from './confirmationsPaging'
import { deliveryFailureKey } from './deliveryFailure'
import {
  describeDelay,
  formatQuietHour,
  formatQuietWindow,
} from './settingsSummary'

function row(overrides: Partial<VerificationItem> = {}): VerificationItem {
  return {
    id: 'v-1',
    status: 'sent',
    reason: null,
    order_id: 'o-1',
    order_number: '1138',
    is_test: false,
    customer_name: null,
    customer_phone: '+201007611456',
    total_price: '10.00',
    currency: 'USD',
    created_at: '2026-09-20T10:00:00Z',
    last_sent_at: '2026-09-20T10:00:00Z',
    delivered_at: null,
    read_at: null,
    confirmed_at: null,
    canceled_at: null,
    expired_at: null,
    no_reply_at: null,
    follow_up_attempts: 0,
    follow_up_sent_at: null,
    ...overrides,
  }
}

describe('resolveRowStatus', () => {
  it('confirmed, with "after the reminder" only when it came later', () => {
    expect(
      resolveRowStatus(
        row({
          status: 'confirmed',
          follow_up_sent_at: '2026-09-20T12:00:00Z',
          confirmed_at: '2026-09-20T13:00:00Z',
        })
      )
    ).toEqual({ badge: 'confirmed', tone: 'success', sub: 'sub.afterFollowUp' })
    expect(
      resolveRowStatus(
        row({ status: 'confirmed', confirmed_at: '2026-09-20T11:00:00Z' })
      ).sub
    ).toBeUndefined()
  })

  it('names a manual confirmation', () => {
    expect(
      resolveRowStatus(
        row({ status: 'confirmed', confirmation_source: 'merchant_manual' })
      ).sub
    ).toBe('sub.manual')
  })

  it('canceled by the customer, noting when the store order was canceled too', () => {
    expect(resolveRowStatus(row({ status: 'canceled' }))).toEqual({
      badge: 'canceledByCustomer',
      tone: 'critical',
      sub: undefined,
    })
    expect(
      resolveRowStatus(
        row({
          status: 'canceled',
          cancellation_source: 'merchant_no_reply',
          canceled_in_store: true,
        })
      )
    ).toEqual({
      badge: 'canceledNoReply',
      tone: 'critical',
      sub: 'sub.canceledInStore',
    })
  })

  it('failed to send, with the WhatsApp reason', () => {
    expect(
      resolveRowStatus(
        row({
          status: 'failed',
          reason: 'provider_delivery_failed',
          failure_code: '131026',
        })
      )
    ).toEqual({
      badge: 'failed',
      tone: 'critical',
      sub: 'failure.notOnWhatsApp',
    })
    expect(
      resolveRowStatus(row({ status: 'failed', reason: 'plan_limit_reached' }))
        .sub
    ).toBe('failure.notSent')
  })

  it('no reply when the server says the row needs action', () => {
    expect(
      resolveRowStatus(
        row({
          status: 'read',
          action_reason: 'no_reply_after_follow_up',
          follow_up_sent_at: '2026-09-20T12:00:00Z',
        })
      )
    ).toEqual({ badge: 'noReply', tone: 'warning', sub: 'sub.followUpSent' })
    expect(resolveRowStatus(row({ status: 'no_reply' })).badge).toBe('noReply')
  })

  it('awaiting a reply otherwise, and scheduled while held by quiet hours', () => {
    expect(resolveRowStatus(row({ status: 'delivered' }))).toEqual({
      badge: 'awaitingReply',
      tone: 'neutral',
    })
    expect(
      resolveRowStatus(
        row({ status: 'pending', scheduled_for: '2026-09-21T06:00:00Z' })
      )
    ).toEqual({
      badge: 'scheduled',
      tone: 'neutral',
      sub: 'sub.sendsAt',
      subTime: '2026-09-21T06:00:00Z',
    })
    expect(resolveRowStatus(row({ status: 'pending' })).badge).toBe('sending')
  })

  it('never decides needs-action itself', () => {
    expect(isNeedsActionRow(row({ status: 'no_reply' }))).toBe(false)
    expect(isNeedsActionRow(row({ action_reason: 'delivery_failed' }))).toBe(
      true
    )
  })
})

describe('deliveryFailureKey', () => {
  it('maps the actionable WhatsApp codes and falls back to generic', () => {
    expect(deliveryFailureKey('131026')).toBe('notOnWhatsApp')
    expect(deliveryFailureKey('131047')).toBe('reengagement')
    expect(deliveryFailureKey('999')).toBe('generic')
    expect(deliveryFailureKey(null)).toBe('generic')
  })
})

describe('settings summary', () => {
  it('says the delay in hours when it divides evenly', () => {
    expect(describeDelay(360)).toEqual({ unit: 'hours', value: 6 })
    expect(describeDelay(90)).toEqual({ unit: 'minutes', value: 90 })
    expect(describeDelay(30)).toEqual({ unit: 'minutes', value: 30 })
  })

  it('writes the quiet window compactly', () => {
    expect(formatQuietWindow('21:00', '09:00', 'en')).toBe('9 PM–9 AM')
    expect(formatQuietWindow('21:00', '09:00', 'ar')).toBe('9م–9ص')
    expect(formatQuietHour('21:30', 'en')).toBe('9:30 PM')
  })

  it('treats a half-configured window as none', () => {
    expect(formatQuietWindow('21:00', null, 'en')).toBeNull()
    expect(formatQuietHour('25:00', 'en')).toBeNull()
  })
})

describe('confirmations paging', () => {
  it('walks forward and back over server cursors', () => {
    const second = nextPage(FIRST_PAGE, 'c1')
    const third = nextPage(second, 'c2')
    expect(currentCursor(FIRST_PAGE)).toBeNull()
    expect(currentCursor(third)).toBe('c2')
    expect(previousPage(third)).toEqual(second)
    expect(previousPage(FIRST_PAGE)).toBe(FIRST_PAGE)
    expect(nextPage(second, null)).toBe(second)
  })

  it('labels the rows shown', () => {
    expect(pageRange(FIRST_PAGE, 20, 8, 8)).toEqual({
      from: 1,
      to: 8,
      total: 8,
    })
    expect(pageRange(nextPage(FIRST_PAGE, 'c1'), 20, 8, 28)).toEqual({
      from: 21,
      to: 28,
      total: 28,
    })
    expect(pageRange(FIRST_PAGE, 20, 0, 0)).toEqual({
      from: 0,
      to: 0,
      total: 0,
    })
  })
})
