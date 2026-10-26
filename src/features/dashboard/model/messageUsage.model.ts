import type { DashboardOverview, UsageState } from './dashboard.model'

/** Which allowance the count belongs to, for the panel's label. */
export type AllowanceKind = 'free' | 'monthly' | 'generic'

export type MessageUsageView =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | {
      kind: 'known'
      used: number
      limit: number
      /** Never below zero, even when usage ran past the limit. */
      remaining: number
      /** Track fill in percent, capped at 100. */
      fill: number
      /** The server's state, unchanged: warning from 80%, ok at limit 0. */
      state: UsageState
      allowance: AllowanceKind
      /** The last refresh failed; the numbers are the last ones known. */
      stale: boolean
    }

const PAID_PLAN_IDS = new Set(['basic', 'pro', 'business'])

/**
 * Starter is the one-time free allowance; the paid plans renew monthly. An
 * unknown plan gets the plain label rather than a guess.
 */
export function resolveAllowanceKind(
  billingPlanId: string | null | undefined
): AllowanceKind {
  if (billingPlanId === 'starter') return 'free'
  if (billingPlanId && PAID_PLAN_IDS.has(billingPlanId)) return 'monthly'
  return 'generic'
}

/**
 * The header's usage view from the overview's usage block. The allowance is
 * the server's: nothing here is derived from the reporting period, and a
 * failed read never turns into a zero.
 */
export function toMessageUsageView(input: {
  usage: DashboardOverview['usage'] | undefined
  isPending: boolean
  isError: boolean
  billingPlanId: string | null | undefined
}): MessageUsageView {
  const { usage } = input
  if (usage === undefined) {
    return input.isPending && !input.isError
      ? { kind: 'loading' }
      : { kind: 'unavailable' }
  }
  if (
    !usage ||
    !Number.isFinite(usage.used) ||
    !Number.isFinite(usage.limit) ||
    usage.limit < 0
  ) {
    return { kind: 'unavailable' }
  }
  const percent = Number.isFinite(usage.percent) ? usage.percent : 0
  return {
    kind: 'known',
    used: usage.used,
    limit: usage.limit,
    remaining: Math.max(0, usage.limit - usage.used),
    fill: Math.min(100, Math.max(0, percent)),
    state: usage.state,
    allowance: resolveAllowanceKind(input.billingPlanId),
    stale: input.isError,
  }
}
