import { describe, expect, it } from 'vitest'
import { failedRowHint } from './failedRowHint'

const failed = (reason: string | null, failure_code: string | null = null) => ({
  status: 'failed' as const,
  reason,
  failure_code,
})

describe('failedRowHint', () => {
  it('says nothing about a row that did not fail', () => {
    expect(
      failedRowHint({ status: 'sent', reason: null, failure_code: null }, true)
    ).toBeNull()
  })

  it('sends a credit failure to buying credits, even when retry is offered', () => {
    expect(failedRowHint(failed('INSUFFICIENT_CREDITS'), true)).toEqual({
      reasonKey: 'failedRow.reason.noCredits',
      action: 'buyCredits',
    })
  })

  it('sends automation-off to settings', () => {
    expect(failedRowHint(failed('auto_verify_disabled'), true)).toEqual({
      reasonKey: 'failedRow.reason.autoVerifyOff',
      action: 'openSettings',
    })
  })

  it('names the WhatsApp delivery error and offers a retry when allowed', () => {
    expect(
      failedRowHint(failed('provider_delivery_failed', '131026'), true)
    ).toEqual({
      reasonKey: 'confirmations.status.failure.notOnWhatsApp',
      action: 'retry',
    })
  })

  it('opens the details when nothing can be retried', () => {
    expect(failedRowHint(failed('provider_not_accepted'), false)).toEqual({
      reasonKey: 'failedRow.reason.rejected',
      action: 'details',
    })
    expect(failedRowHint(failed(null), false)).toEqual({
      reasonKey: 'confirmations.status.failure.notSent',
      action: 'details',
    })
  })
})
