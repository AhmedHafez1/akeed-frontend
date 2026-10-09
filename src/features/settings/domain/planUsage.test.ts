import { describe, expect, it } from 'vitest'
import {
  recommendPlan,
  resolvePrimaryPlanId,
  resolveUsageBanner,
  usagePercent,
} from './planUsage'

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
  it('recommends nothing without history', () => {
    expect(recommendPlan(PLANS, 0)).toBeNull()
    expect(recommendPlan(PLANS, -1)).toBeNull()
  })

  it('picks the smallest plan covering 1.5× the last 30 days', () => {
    expect(recommendPlan(PLANS, 120)).toBe('basic') // needs 180
    expect(recommendPlan(PLANS, 200)).toBe('basic') // needs 300
    expect(recommendPlan(PLANS, 201)).toBe('pro') // needs 301.5
    expect(recommendPlan(PLANS, 264)).toBe('pro') // needs 396
    expect(recommendPlan(PLANS, 900)).toBe('business') // needs 1350
  })

  it('picks the largest plan when volume exceeds every plan', () => {
    expect(recommendPlan(PLANS, 5000)).toBe('business')
  })

  it('never recommends the free plan and ignores input order', () => {
    expect(recommendPlan([...PLANS].reverse(), 5)).toBe('basic')
  })

  it('returns null without paid plans', () => {
    expect(recommendPlan([PLANS[0]], 10)).toBeNull()
  })
})

describe('resolvePrimaryPlanId', () => {
  it('is the recommended plan when the store is not on it', () => {
    expect(resolvePrimaryPlanId(PLANS, 'starter', 'basic')).toBe('basic')
    expect(resolvePrimaryPlanId(PLANS, 'basic', 'pro')).toBe('pro')
    expect(resolvePrimaryPlanId(PLANS, 'business', 'basic')).toBe('basic')
  })

  it('is the next plan up when the store is on the recommended plan', () => {
    expect(resolvePrimaryPlanId(PLANS, 'basic', 'basic')).toBe('pro')
    expect(resolvePrimaryPlanId(PLANS, 'pro', 'pro')).toBe('business')
  })

  it('is the smallest other plan on the largest plan', () => {
    expect(resolvePrimaryPlanId(PLANS, 'business', 'business')).toBe('basic')
  })

  it('is the smallest plan the store is not on without a recommendation', () => {
    expect(resolvePrimaryPlanId(PLANS, 'starter', null)).toBe('basic')
    expect(resolvePrimaryPlanId(PLANS, null, null)).toBe('basic')
    expect(resolvePrimaryPlanId(PLANS, 'basic', null)).toBe('pro')
  })

  it('is null when there is no other paid plan', () => {
    expect(resolvePrimaryPlanId([PLANS[0]], 'starter', null)).toBeNull()
    expect(resolvePrimaryPlanId(PLANS.slice(0, 2), 'basic', 'basic')).toBeNull()
  })
})
