import { describe, expect, it } from 'vitest'
import type { AutoCancelView, VerificationItem } from '../model/dashboard.model'
import { autoCancelMarker, autoCancelToggleAction } from './autoCancel'
import { canCancelOrder } from './cancellation'
import { planConfirmationRowActions } from './confirmationRowActions'
import { resolveRowStatus } from './confirmationRowStatus'

const AT = '2026-10-21T09:00:00.000Z'

function view(overrides: Partial<AutoCancelView> = {}): AutoCancelView {
  return {
    state: 'scheduled',
    scheduled_for: AT,
    reason: null,
    excluded: false,
    late_reply: false,
    ...overrides,
  }
}

function row(overrides: Partial<VerificationItem>): VerificationItem {
  return {
    id: 'v1',
    status: 'no_reply',
    is_test: false,
    action_reason: 'no_reply',
    capabilities: [
      { action: 'merchant_no_reply_cancellation', supported: true },
      { action: 'auto_cancel_exclusion', supported: true },
    ],
    auto_cancel: view(),
    ...overrides,
  } as VerificationItem
}

describe('autoCancelMarker', () => {
  it('shows the time of a scheduled or projected cancellation', () => {
    expect(autoCancelMarker(row({}))).toEqual({ key: 'scheduled', time: AT })
    expect(
      autoCancelMarker(
        row({ status: 'delivered', auto_cancel: view({ state: 'projected' }) })
      )
    ).toEqual({ key: 'scheduled', time: AT })
  })

  it('names why a cancellation is paused', () => {
    expect(
      autoCancelMarker(
        row({
          auto_cancel: view({
            state: 'paused',
            scheduled_for: null,
            reason: 'reminder_blocked',
          }),
        })
      )
    ).toEqual({ key: 'paused', reason: 'reminder_blocked' })
  })

  it.each([
    [
      view({ excluded: true, state: 'stopped', scheduled_for: null }),
      'excluded',
    ],
    [view({ state: 'awaiting_platform', scheduled_for: null }), 'inProgress'],
    [view({ state: 'failed', scheduled_for: null }), 'failed'],
  ] as const)('marks %j as %s', (autoCancel, key) => {
    expect(autoCancelMarker(row({ auto_cancel: autoCancel }))?.key).toBe(key)
  })

  it('shows nothing for a settled order or a store without it', () => {
    expect(autoCancelMarker(row({ status: 'confirmed' }))).toBeNull()
    expect(autoCancelMarker(row({ status: 'canceled' }))).toBeNull()
    expect(autoCancelMarker(row({ auto_cancel: null }))).toBeNull()
  })
})

describe('auto-cancel row action', () => {
  it('offers to keep the order out, then to let it back in', () => {
    expect(autoCancelToggleAction(row({ status: 'delivered' }))).toBe('exclude')
    expect(
      autoCancelToggleAction(
        row({ status: 'delivered', auto_cancel: view({ excluded: true }) })
      )
    ).toBe('include')
  })

  it.each([false, true])(
    'hides both toggles at no reply even with stale capabilities (excluded=%s)',
    (excluded) => {
      const verification = row({ auto_cancel: view({ excluded }) })
      expect(autoCancelToggleAction(verification)).toBeNull()
      expect(
        planConfirmationRowActions(verification, {
          canWrite: true,
          canRetry: true,
        }).autoCancelToggle
      ).toBeNull()
    }
  )

  it('is offered only where the server allows it, and never to a viewer', () => {
    expect(
      autoCancelToggleAction(
        row({
          status: 'delivered',
          capabilities: [{ action: 'auto_cancel_exclusion', supported: false }],
        })
      )
    ).toBeNull()
    expect(
      planConfirmationRowActions(row({ status: 'delivered' }), {
        canWrite: false,
        canRetry: false,
      }).autoCancelToggle
    ).toBeNull()
  })
})

describe('auto-cancel statuses', () => {
  it('says why Akeed canceled the order', () => {
    expect(
      resolveRowStatus(
        row({ status: 'canceled', cancellation_source: 'automatic_no_reply' })
      ).sub
    ).toBe('sub.canceledAutomatically')
  })

  it('flags a reply that came after the cancellation, and offers no second cancel', () => {
    const late = row({
      status: 'canceled',
      cancellation_source: 'automatic_no_reply',
      action_reason: 'late_reply_after_auto_cancel',
    })
    expect(resolveRowStatus(late).sub).toBe('sub.lateReplyAfterAutoCancel')
    expect(canCancelOrder(late)).toBe(false)
  })

  it('shows a customer who wrote without answering as replied', () => {
    const replied = row({
      status: 'delivered',
      action_reason: 'customer_replied',
    })
    expect(resolveRowStatus(replied)).toMatchObject({
      badge: 'customerReplied',
      kind: 'needsAction',
    })
    // Not at no reply yet, so the server would refuse a cancel.
    expect(canCancelOrder(replied)).toBe(false)
    expect(
      canCancelOrder(
        row({ status: 'no_reply', action_reason: 'customer_replied' })
      )
    ).toBe(true)
  })
})
