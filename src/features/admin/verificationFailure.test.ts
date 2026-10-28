import { describe, expect, it } from 'vitest'
import { describeVerificationFailure } from './verificationFailure'

const failed = (
  reason: string | null,
  failure_code: string | null = null,
  failure_title: string | null = null
) => ({ status: 'failed', reason, failure_code, failure_title })

describe('describeVerificationFailure', () => {
  it('is null for a verification that did not fail', () => {
    expect(
      describeVerificationFailure({ ...failed('x'), status: 'confirmed' })
    ).toBeNull()
  })

  it('names a number WhatsApp could not deliver to and quotes the provider error', () => {
    expect(
      describeVerificationFailure(
        failed('provider_delivery_failed', '131026', 'Message undeliverable')
      )
    ).toEqual({
      label: 'WhatsApp could not deliver to the customer number',
      detail:
        'The number may not be on WhatsApp, or the customer has not accepted the latest terms or runs an outdated app. WhatsApp error 131026: Message undeliverable.',
    })
  })

  it('treats any 132xxx code as a template problem', () => {
    expect(
      describeVerificationFailure(failed('provider_delivery_failed', '132001'))
        ?.label
    ).toBe('Template problem')
  })

  it('falls back to a generic delivery failure with the code', () => {
    expect(
      describeVerificationFailure(failed('provider_delivery_failed', '999999'))
    ).toEqual({
      label: 'Delivery failed',
      detail:
        'WhatsApp accepted the message but could not deliver it. WhatsApp error 999999.',
    })
    expect(
      describeVerificationFailure(failed('provider_delivery_failed'))?.detail
    ).toBe('WhatsApp accepted the message but could not deliver it.')
  })

  it('explains failures to send and blocked sends', () => {
    expect(
      describeVerificationFailure(failed('provider_not_accepted'))?.label
    ).toBe('Failed to send: WhatsApp rejected it')
    expect(
      describeVerificationFailure(failed('provider_outcome_unknown'))?.label
    ).toBe('Failed to send: not confirmed')
    expect(
      describeVerificationFailure(failed('INSUFFICIENT_CREDITS'))?.label
    ).toBe('No credits')
  })

  it('shows an unknown reason code in readable form', () => {
    expect(describeVerificationFailure(failed('some_new_reason'))).toEqual({
      label: 'Some new reason',
      detail: 'Reason code: some_new_reason.',
    })
  })

  it('says so when nothing was recorded', () => {
    expect(describeVerificationFailure(failed(null))?.label).toBe(
      'No reason recorded'
    )
  })
})
