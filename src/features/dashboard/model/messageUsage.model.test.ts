import { describe, expect, it } from 'vitest'
import { resolveAllowanceKind, toMessageUsageView } from './messageUsage.model'
import type { UsageState } from './dashboard.model'

function view(
  used: number,
  limit: number,
  percent: number,
  state: UsageState,
  extra: { isError?: boolean; billingPlanId?: string | null } = {}
) {
  return toMessageUsageView({
    usage: { used, limit, percent, state },
    isPending: false,
    isError: extra.isError ?? false,
    billingPlanId: extra.billingPlanId ?? 'starter',
  })
}

describe('toMessageUsageView', () => {
  it.each([
    [6, 30, 20, 'ok', 24],
    [24, 30, 80, 'warning', 6],
    [25, 30, 83, 'warning', 5],
    [29, 30, 96, 'warning', 1],
    [30, 30, 100, 'exhausted', 0],
  ] as const)(
    '%i of %i keeps the server state and counts what is left',
    (used, limit, percent, state, remaining) => {
      expect(view(used, limit, percent, state)).toMatchObject({
        kind: 'known',
        used,
        limit,
        remaining,
        fill: percent,
        state,
        allowance: 'free',
        stale: false,
      })
    }
  )

  it('keeps an over-limit count, clamps what is left and caps the fill', () => {
    expect(view(34, 30, 113, 'exhausted')).toMatchObject({
      used: 34,
      remaining: 0,
      fill: 100,
      state: 'exhausted',
    })
  })

  it('follows the server for a zero limit instead of claiming a stop', () => {
    expect(view(0, 0, 0, 'ok')).toMatchObject({
      kind: 'known',
      limit: 0,
      state: 'ok',
    })
  })

  it('is loading until the first read settles', () => {
    expect(
      toMessageUsageView({
        usage: undefined,
        isPending: true,
        isError: false,
        billingPlanId: null,
      })
    ).toEqual({ kind: 'loading' })
  })

  it('is unavailable without usage, never a false zero', () => {
    expect(
      toMessageUsageView({
        usage: null,
        isPending: false,
        isError: false,
        billingPlanId: 'starter',
      })
    ).toEqual({ kind: 'unavailable' })
    expect(
      toMessageUsageView({
        usage: undefined,
        isPending: false,
        isError: true,
        billingPlanId: 'starter',
      })
    ).toEqual({ kind: 'unavailable' })
  })

  it('keeps the last known numbers after a failed refresh, marked stale', () => {
    expect(view(25, 30, 83, 'warning', { isError: true })).toMatchObject({
      kind: 'known',
      remaining: 5,
      stale: true,
    })
  })
})

describe('resolveAllowanceKind', () => {
  it('names Starter free, the paid plans monthly and anything else plainly', () => {
    expect(resolveAllowanceKind('starter')).toBe('free')
    expect(resolveAllowanceKind('basic')).toBe('monthly')
    expect(resolveAllowanceKind('pro')).toBe('monthly')
    expect(resolveAllowanceKind('business')).toBe('monthly')
    expect(resolveAllowanceKind(null)).toBe('generic')
    expect(resolveAllowanceKind(undefined)).toBe('generic')
  })
})
