import { describe, expect, it } from 'vitest'
import { recommendPlan, resolveUsageBanner, usagePercent } from './planUsage'

const PLANS = [
  { id: 'starter', amount: 0, includedVerifications: 30 },
  { id: 'basic', amount: 9.99, includedVerifications: 300 },
  { id: 'pro', amount: 22.99, includedVerifications: 1000 },
  { id: 'business', amount: 49.99, includedVerifications: 2500 },
]

describe('resolveUsageBanner', () => {
  it('is hidden below 80%', () => {
    expect(resolveUsageBanner(23, 30)).toBeNull()
    expect(resolveUsageBanner(0, 300)).toBeNull()
  })

  it('warns from 80% with the messages left', () => {
    expect(resolveUsageBanner(24, 30)).toEqual({
      tone: 'warning',
      remaining: 6,
    })
    expect(resolveUsageBanner(27, 30)).toEqual({
      tone: 'warning',
      remaining: 3,
    })
  })

  it('is critical at 100% and beyond', () => {
    expect(resolveUsageBanner(30, 30)).toEqual({
      tone: 'critical',
      remaining: 0,
    })
    expect(resolveUsageBanner(31, 30)).toEqual({
      tone: 'critical',
      remaining: 0,
    })
  })

  it('shows nothing without a limit', () => {
    expect(resolveUsageBanner(5, 0)).toBeNull()
  })
})

describe('usagePercent', () => {
  it('rounds and clamps', () => {
    expect(usagePercent(27, 30)).toBe(90)
    expect(usagePercent(45, 30)).toBe(100)
    expect(usagePercent(1, 0)).toBe(0)
  })
})

describe('recommendPlan', () => {
  it('falls back to Basic with no history', () => {
    expect(recommendPlan(PLANS, 0)).toBe('basic')
  })

  it('picks the smallest plan covering 3× the last 30 days', () => {
    expect(recommendPlan(PLANS, 28)).toBe('basic') // needs 84
    expect(recommendPlan(PLANS, 100)).toBe('basic') // needs 300
    expect(recommendPlan(PLANS, 101)).toBe('pro') // needs 303
    expect(recommendPlan(PLANS, 334)).toBe('business') // needs 1002
  })

  it('picks the largest plan when volume exceeds every plan', () => {
    expect(recommendPlan(PLANS, 5000)).toBe('business')
  })

  it('never recommends the free plan and ignores input order', () => {
    expect(recommendPlan([...PLANS].reverse(), 5)).toBe('basic')
  })

  it('uses the smallest paid plan when Basic is missing', () => {
    expect(
      recommendPlan(
        PLANS.filter((plan) => plan.id !== 'basic'),
        0
      )
    ).toBe('pro')
  })

  it('returns null without paid plans', () => {
    expect(recommendPlan([PLANS[0]], 10)).toBeNull()
  })
})
