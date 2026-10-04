import { describe, expect, it } from 'vitest'
import type { RemoteSync } from '@/shared/types/commerce-outcome.model'
import { remoteSyncView } from './remoteSync'

function sync(overrides: Partial<RemoteSync> = {}): RemoteSync {
  return {
    state: 'succeeded',
    action: 'customer_confirmation',
    error_code: null,
    requires_assistance: false,
    retryable: false,
    updated_at: '2026-10-03T10:00:00.000Z',
    ...overrides,
  }
}

describe('remoteSyncView', () => {
  it.each([undefined, null])(
    'has nothing to say for a source that reports no sync (%s)',
    (remote_sync) => {
      expect(remoteSyncView({ remote_sync })).toBeNull()
    }
  )

  it('reports a store that has the result, with nothing to do', () => {
    expect(remoteSyncView({ remote_sync: sync() })).toEqual({
      state: 'succeeded',
      badge: 'confirmed',
      labelKey: 'state.succeeded',
      canRetry: false,
      updatedAt: '2026-10-03T10:00:00.000Z',
    })
  })

  it('says a pending update is still being tried and offers no retry', () => {
    expect(
      remoteSyncView({
        remote_sync: sync({
          state: 'pending',
          error_code: 'write_unconfirmed',
        }),
      })
    ).toMatchObject({
      labelKey: 'state.pending',
      guidanceKey: 'guidance.pending',
      rowNoteKey: 'row.pending',
      canRetry: false,
    })
  })

  it('explains that no reply stays local and is not a store cancellation', () => {
    expect(
      remoteSyncView({
        remote_sync: sync({
          state: 'unsupported',
          action: 'automatic_no_reply_tagging',
          error_code: 'capability_not_supported',
        }),
      })
    ).toMatchObject({
      labelKey: 'state.unsupported',
      guidanceKey: 'guidance.noReplyLocalOnly',
      canRetry: false,
    })
  })

  it('explains an update that is not switched on', () => {
    const view = remoteSyncView({
      remote_sync: sync({
        state: 'unsupported',
        error_code: 'capability_not_supported',
      }),
    })

    expect(view?.guidanceKey).toBe('guidance.notSwitchedOn')
    expect(view?.rowNoteKey).toBeUndefined()
  })

  it.each([
    ['remote_state_conflict', false, 'guidance.stateConflict'],
    ['order_not_found', false, 'guidance.orderNotFound'],
    ['source_credentials_rejected', true, 'guidance.reconnect'],
    ['source_store_inactive', false, 'guidance.storeInactive'],
    // Each needs the merchant, and "reconnect" alone would not say what to do.
    ['source_permission_denied', true, 'guidance.permissionDenied'],
    ['store_unreachable', true, 'guidance.storeUnreachable'],
    ['store_write_method_refused', true, 'guidance.hostingBlocksUpdates'],
    ['store_unverified', false, 'guidance.failed'],
    ['remote_rejected', false, 'guidance.failed'],
    ['source_unavailable', false, 'guidance.failed'],
    ['some_future_code', false, 'guidance.failed'],
    ['some_future_code', true, 'guidance.reconnect'],
    [null, false, 'guidance.failed'],
  ] as const)(
    'gives a failure with %s (assistance %s) the %s sentence',
    (error_code, requires_assistance, guidanceKey) => {
      expect(
        remoteSyncView({
          remote_sync: sync({
            state: 'failed',
            error_code,
            requires_assistance,
            retryable: true,
          }),
        })
      ).toMatchObject({
        badge: 'failed',
        labelKey: 'state.failed',
        guidanceKey,
        rowNoteKey: 'row.failed',
        canRetry: true,
      })
    }
  )

  it('offers a retry only when the server says the failure is retryable', () => {
    expect(
      remoteSyncView({
        remote_sync: sync({ state: 'failed', retryable: false }),
      })?.canRetry
    ).toBe(false)
  })

  it('never surfaces a raw error code as a key', () => {
    const view = remoteSyncView({
      remote_sync: sync({ state: 'failed', error_code: '__proto__' }),
    })

    expect(view?.guidanceKey).toBe('guidance.failed')
  })
})
