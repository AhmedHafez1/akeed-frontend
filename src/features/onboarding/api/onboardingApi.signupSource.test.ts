import { afterEach, describe, expect, it } from 'vitest'
import {
  clearKnownOnboardingSource,
  getKnownSignupSource,
  rememberSignupSource,
} from './onboardingApi'

describe('the remembered signup source', () => {
  afterEach(() => clearKnownOnboardingSource())

  it('keeps the platform the guard read from the session', () => {
    rememberSignupSource('easyorders')

    expect(getKnownSignupSource()).toBe('easyorders')
  })

  it.each([undefined, null, 42, { id: 'easyorders' }])(
    'keeps nothing for %p',
    (value) => {
      rememberSignupSource(value)

      expect(getKnownSignupSource()).toBeNull()
    }
  )

  it('is forgotten with the rest of the known source, as on sign-out', () => {
    rememberSignupSource('easyorders')
    clearKnownOnboardingSource()

    expect(getKnownSignupSource()).toBeNull()
  })
})
