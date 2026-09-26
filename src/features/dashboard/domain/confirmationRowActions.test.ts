import { describe, expect, it } from 'vitest'
import type {
  VerificationItem,
  VerificationRowAction,
} from '../model/dashboard.model'
import { planConfirmationRowActions } from './confirmationRowActions'

function capabilities(...actions: VerificationRowAction[]) {
  return actions.map((action) => ({ action, supported: true }))
}

function row(overrides: Partial<VerificationItem>): VerificationItem {
  return {
    id: 'v1',
    status: 'awaiting_response',
    is_test: false,
    action_reason: null,
    capabilities: [],
    ...overrides,
  } as VerificationItem
}

const owner = { canWrite: true, canRetry: true }
const viewer = { canWrite: false, canRetry: false }

describe('planConfirmationRowActions', () => {
  it('offers a chat, manual confirm and cancel on an unanswered order', () => {
    const plan = planConfirmationRowActions(
      row({
        status: 'no_reply',
        action_reason: 'no_reply',
        capabilities: capabilities(
          'merchant_manual_confirmation',
          'merchant_no_reply_cancellation'
        ),
      }),
      owner
    )
    expect(plan).toEqual({
      primary: 'chat',
      canConfirm: true,
      canRetry: false,
      canCancel: true,
    })
  })

  it('offers no chat for a failed delivery, only the retry', () => {
    const plan = planConfirmationRowActions(
      row({
        status: 'failed',
        action_reason: 'delivery_failed',
        capabilities: capabilities('retry_verification'),
      }),
      owner
    )
    expect(plan.primary).toBeNull()
    expect(plan.canRetry).toBe(true)
    expect(plan.canCancel).toBe(false)
  })

  it('offers shipping details for a real confirmed order', () => {
    expect(
      planConfirmationRowActions(row({ status: 'confirmed' }), owner).primary
    ).toBe('shipping')
    expect(
      planConfirmationRowActions(
        row({ status: 'confirmed', is_test: true }),
        owner
      ).primary
    ).toBeNull()
  })

  it('leaves a viewer only the links', () => {
    const plan = planConfirmationRowActions(
      row({
        status: 'no_reply',
        action_reason: 'no_reply',
        capabilities: capabilities(
          'merchant_manual_confirmation',
          'merchant_no_reply_cancellation',
          'retry_verification'
        ),
      }),
      viewer
    )
    expect(plan).toEqual({
      primary: 'chat',
      canConfirm: false,
      canRetry: false,
      canCancel: false,
    })
  })

  it('offers nothing on a row shown ahead of the server', () => {
    const plan = planConfirmationRowActions(
      row({ optimistic: 'queued', action_reason: 'no_reply' }),
      owner
    )
    expect(plan).toEqual({
      primary: null,
      canConfirm: false,
      canRetry: false,
      canCancel: false,
    })
  })
})
