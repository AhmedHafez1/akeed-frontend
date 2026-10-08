import { describe, expect, it } from 'vitest'
import {
  ONBOARDING_PROGRESS_STEPS,
  parseSourceSetupStep,
  resolveOnboardingProgress,
} from './onboardingProgress'

const states = (
  skin: Parameters<typeof resolveOnboardingProgress>[0],
  step: string | null
) =>
  resolveOnboardingProgress(skin, step).steps.map(
    ({ id, state }) => `${id}:${state}`
  )

describe('resolveOnboardingProgress', () => {
  it('keeps standalone at three steps, the account always done', () => {
    expect(states('standalone', null)).toEqual([
      'account:done',
      'store:current',
      'test:upcoming',
    ])
    expect(resolveOnboardingProgress('standalone', 'test')).toMatchObject({
      current: 3,
      total: 3,
      titleKey: 'test',
    })
  })

  it('adds connecting the store for WooCommerce', () => {
    expect(states('woocommerce', null)).toEqual([
      'account:done',
      'connect:current',
      'store:upcoming',
      'test:upcoming',
    ])
    expect(resolveOnboardingProgress('woocommerce', 'store')).toMatchObject({
      current: 3,
      total: 4,
      titleKey: 'number',
    })
  })

  it('adds connecting the store and its details for EasyOrders', () => {
    expect(states('easyorders', 'details')).toEqual([
      'account:done',
      'connect:done',
      'details:current',
      'store:upcoming',
      'test:upcoming',
    ])
    expect(resolveOnboardingProgress('easyorders', 'details')).toMatchObject({
      current: 3,
      total: 5,
      titleKey: 'details',
      fraction: 3 / 5,
    })
  })

  it('shows every step done once setup is finished', () => {
    const progress = resolveOnboardingProgress('easyorders', 'done')

    expect(progress.steps.every((step) => step.state === 'done')).toBe(true)
    expect(progress).toMatchObject({
      current: 5,
      total: 5,
      titleKey: 'test',
      fraction: 1,
    })
  })

  it('falls back to the first step after the account for a step the source does not have', () => {
    expect(resolveOnboardingProgress('standalone', 'connect').titleKey).toBe(
      'store'
    )
    expect(resolveOnboardingProgress('woocommerce', 'details').titleKey).toBe(
      'connectStore'
    )
    expect(resolveOnboardingProgress('woocommerce', 'nonsense').current).toBe(2)
  })

  it('starts every source with the account and ends it with the test', () => {
    for (const steps of Object.values(ONBOARDING_PROGRESS_STEPS)) {
      expect(steps[0].id).toBe('account')
      expect(steps[steps.length - 1].id).toBe('test')
    }
  })
})

describe('parseSourceSetupStep', () => {
  it('accepts the setup steps and nothing else', () => {
    expect(parseSourceSetupStep('connect')).toBe('connect')
    expect(parseSourceSetupStep('details')).toBe('details')
    expect(parseSourceSetupStep('done')).toBe('done')
    expect(parseSourceSetupStep('billing')).toBeNull()
    expect(parseSourceSetupStep(null)).toBeNull()
  })
})
