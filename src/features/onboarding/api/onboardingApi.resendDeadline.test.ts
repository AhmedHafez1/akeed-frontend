import { describe, expect, it } from 'vitest'
import type { OnboardingTestState } from '@/features/onboarding/domain/onboarding.types'
import { withLocalResendDeadline } from './onboardingApi'

const NOW = Date.parse('2026-10-09T07:06:00.000Z')

function state(overrides: Partial<OnboardingTestState>): OnboardingTestState {
  return {
    resendAvailableAt: null,
    sendsRemainingToday: 4,
    ...overrides,
  } as OnboardingTestState
}

describe('withLocalResendDeadline', () => {
  it('counts the cooldown from this clock, whatever the server clock says', () => {
    const result = withLocalResendDeadline(
      state({
        // A server five minutes ahead of this browser.
        resendAvailableAt: '2026-10-09T07:11:20.000Z',
        resendAvailableInSeconds: 20,
      }),
      NOW
    )

    expect(result.resendAvailableAt).toBe('2026-10-09T07:06:20.000Z')
  })

  it('clears a deadline the server says has passed', () => {
    const result = withLocalResendDeadline(
      state({
        resendAvailableAt: '2026-10-09T07:06:10.000Z',
        resendAvailableInSeconds: 0,
      }),
      NOW
    )

    expect(result.resendAvailableAt).toBeNull()
  })

  it('keeps the server time when no relative cooldown is sent', () => {
    const input = state({ resendAvailableAt: '2026-10-09T07:06:10.000Z' })

    expect(withLocalResendDeadline(input, NOW)).toBe(input)
  })
})
