import { describe, expect, it } from 'vitest'
import {
  planCovers,
  recommendPlan,
  resolvePlanUsageBanner,
  resolvePrimaryPlanId,
  resolveUsageBanner,
  usagePercent,
} from './planUsage'
import type { PlanNumberState } from './planNumber'

const PLANS = [
  {
    id: 'starter',
    amount: 0,
    includedVerifications: 30,
    ownNumberIncludedVerifications: 90,
  },
  {
    id: 'basic',
    amount: 9.99,
    includedVerifications: 300,
    ownNumberIncludedVerifications: 1000,
  },
  {
    id: 'pro',
    amount: 22.99,
    includedVerifications: 1000,
    ownNumberIncludedVerifications: 5000,
  },
  {
    id: 'business',
    amount: 49.99,
    includedVerifications: 2500,
    ownNumberIncludedVerifications: 20000,
  },
]

describe('Plan usage banner', () => {
  function banner(
    akeedLeft: number,
    ownLeft: number,
    status: PlanNumberState['status'] = 'ready',
    overrides: Partial<Parameters<typeof resolvePlanUsageBanner>[0]> = {}
  ) {
    const combined = status === 'ready' || status === 'partial'
    return resolvePlanUsageBanner({
      active: true,
      used: combined ? 1300 - akeedLeft - ownLeft : 300 - akeedLeft,
      limit: combined ? 1300 : 300,
      pools: {
        akeed: { used: 300 - akeedLeft, limit: 300, remaining: akeedLeft },
        ownNumber: { used: 1000 - ownLeft, limit: 1000, remaining: ownLeft },
      },
      number: {
        status,
        connected: ['ready', 'partial', 'attention'].includes(status),
        visible: true,
        canConnect: true,
      },
      ...overrides,
    })
  }
  it('does not call either single-pool exhaustion total exhaustion', () => {
    expect(banner(0, 800)).toBeNull()
    expect(banner(300, 0)).toBeNull()
  })
  it('warns at 80% combined usage and counts the messages still usable', () => {
    expect(banner(0, 261)).toBeNull()
    expect(banner(0, 260)).toMatchObject({ kind: 'low', remaining: 260 })
    expect(banner(1, 0)).toMatchObject({ kind: 'low', remaining: 1 })
  })
  it('shows the existing exhaustion state only when no usable messages remain', () => {
    expect(banner(0, 0)).toMatchObject({ kind: 'exhausted', tone: 'critical' })
  })
  it('offers connection only when available, permitted, and allowance remains', () => {
    expect(banner(0, 800, 'unconnected')).toMatchObject({
      kind: 'connect',
      remaining: 800,
    })
    for (const number of [
      {
        status: 'unconnected',
        connected: false,
        visible: false,
        canConnect: true,
      },
      {
        status: 'unconnected',
        connected: false,
        visible: true,
        canConnect: false,
      },
    ] satisfies PlanNumberState[]) {
      expect(banner(0, 800, 'unconnected', { number })).toMatchObject({
        kind: 'exhausted',
      })
    }
    expect(banner(0, 0, 'unconnected')).toMatchObject({ kind: 'exhausted' })
  })
  it.each([
    ['preparing', 'setup'],
    ['disconnected', 'reconnect'],
    ['attention', 'attention'],
    ['partial', 'partial'],
  ] as const)('guides %s to %s when Akeed is empty', (status, kind) => {
    expect(banner(0, 800, status)).toMatchObject({
      kind,
      tone: 'warning',
      remaining: 800,
    })
    expect(banner(100, 800, status)).toBeNull()
  })
  it('does not interpret unknown connection status as a connection offer', () => {
    expect(banner(0, 800, 'unknown')).toMatchObject({ kind: 'exhausted' })
  })
  it('preserves server usage rather than adding inaccessible pools', () => {
    expect(
      banner(100, 800, 'attention', { used: 240, limit: 300 })
    ).toMatchObject({ kind: 'low', remaining: 60 })
  })
  it('supports older responses without pools without inventing an allowance', () => {
    expect(banner(0, 800, 'unconnected', { pools: null })).toMatchObject({
      kind: 'exhausted',
    })
  })
  it('suppresses allowance banners when no plan is active', () => {
    expect(banner(0, 0, 'ready', { active: false })).toBeNull()
    expect(banner(0, 800, 'unconnected', { active: false })).toBeNull()
  })
})

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

  it('sizes each plan with its own pools for mixed senders', () => {
    // 264 messages in all would need Pro; 64 from Akeed's pool and 200 from
    // the own number fit Basic's 300 + 1,000.
    expect(recommendPlan(PLANS, 264, { akeed: 64, ownNumber: 200 })).toBe(
      'basic'
    )
    // Basic's own pool covers 1,000 / 1.5 own-number messages; beyond that
    // they spill into the Akeed pool and Pro's larger pools fit.
    expect(recommendPlan(PLANS, 1100, { akeed: 100, ownNumber: 1000 })).toBe(
      'pro'
    )
    // Scale's 20,000 own-number pool is what fits high own-number volume.
    expect(recommendPlan(PLANS, 6000, { akeed: 500, ownNumber: 5500 })).toBe(
      'business'
    )
  })

  it("spills own-number volume past a plan's own pool into its Akeed pool", () => {
    const basic = PLANS[1]
    // 600 own-number messages need 900 with headroom: under Basic's 1,000.
    expect(planCovers(basic, 700, { akeed: 100, ownNumber: 600 })).toBe(true)
    // 800 need 1,200: 200 spill over, and 150 + 200 exceeds 300.
    expect(planCovers(basic, 900, { akeed: 100, ownNumber: 800 })).toBe(false)
  })

  it('counts every message against the Akeed allowance without pool figures', () => {
    expect(planCovers(PLANS[1], 200)).toBe(true)
    expect(planCovers(PLANS[1], 201, null)).toBe(false)
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
