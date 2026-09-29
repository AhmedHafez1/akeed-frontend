import { describe, expect, it } from 'vitest'
import {
  resolveStandaloneFirstRun,
  shouldShowSkippedTestReminder,
  type DashboardActivationState,
} from './activation.model'

const activation = {
  setupCompletedAt: '2026-09-29T08:00:00.000Z',
  testSentAt: null,
  testConfirmedAt: null,
  testSkippedAt: null,
  firstRealConfirmedAt: null,
  isLive: true,
  needsPlan: false,
}

function state(
  overrides: Partial<NonNullable<DashboardActivationState['activation']>>
): DashboardActivationState {
  return {
    isAutoVerifyEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    billingPlanId: null,
    activation: { ...activation, ...overrides },
  }
}

describe('resolveStandaloneFirstRun', () => {
  it('is loading until the onboarding state arrives', () => {
    expect(resolveStandaloneFirstRun(undefined)).toBe('loading')
  })

  it('is first run while the organization has no real order', () => {
    expect(resolveStandaloneFirstRun(state({ hasRealOrders: false }))).toBe(
      'first-run'
    )
  })

  it('is active once a real order exists', () => {
    expect(resolveStandaloneFirstRun(state({ hasRealOrders: true }))).toBe(
      'active'
    )
  })

  it('is active when the API does not report real orders yet', () => {
    expect(resolveStandaloneFirstRun(state({}))).toBe('active')
  })
})

describe('shouldShowSkippedTestReminder', () => {
  it('shows after a skip that was never followed by a confirmed test', () => {
    expect(
      shouldShowSkippedTestReminder(
        state({ testSkippedAt: '2026-09-29T08:05:00.000Z' }).activation
      )
    ).toBe(true)
  })

  it('hides once the test was confirmed, or when it was never skipped', () => {
    expect(
      shouldShowSkippedTestReminder(
        state({
          testSkippedAt: '2026-09-29T08:05:00.000Z',
          testConfirmedAt: '2026-09-29T09:00:00.000Z',
        }).activation
      )
    ).toBe(false)
    expect(shouldShowSkippedTestReminder(state({}).activation)).toBe(false)
    expect(shouldShowSkippedTestReminder(undefined)).toBe(false)
  })
})
