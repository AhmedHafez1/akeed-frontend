import type { UsagePools } from '@/shared/types/usagePools'
import type { PlanNumberState } from './planNumber'

/**
 * Plan-tab rules: the credits banner thresholds and the recommended plan.
 * Both are pure so the thresholds and sizing are pinned by unit tests.
 */

export const USAGE_WARNING_RATIO = 0.8
/** A plan should cover this many times the store's recent monthly volume. */
export const RECOMMENDATION_HEADROOM = 1.5

export type UsageBannerTone = 'warning' | 'critical'

export interface UsageBanner {
  tone: UsageBannerTone
  remaining: number
}

/** Hidden below 80%, warning from 80%, critical once nothing is left. */
export function resolveUsageBanner(
  used: number,
  limit: number
): UsageBanner | null {
  if (limit <= 0) return null
  const remaining = Math.max(0, limit - used)
  if (used >= limit) return { tone: 'critical', remaining }
  if (used / limit >= USAGE_WARNING_RATIO) return { tone: 'warning', remaining }
  return null
}

export interface PlanUsageBanner {
  kind:
    | 'low'
    | 'exhausted'
    | 'connect'
    | 'setup'
    | 'reconnect'
    | 'attention'
    | 'partial'
  tone: UsageBannerTone
  remaining: number
}

/** Server totals describe usable capacity; persisted pools describe ownership. */
export function resolvePlanUsageBanner(params: {
  active: boolean
  used: number
  limit: number
  pools?: UsagePools | null
  number: PlanNumberState
}): PlanUsageBanner | null {
  if (!params.active) return null
  const { used, limit, pools, number } = params
  const ownRemaining = pools?.ownNumber.remaining ?? 0
  const akeedEmpty = Boolean(pools && pools.akeed.remaining <= 0)
  if (akeedEmpty && ownRemaining > 0 && number.status !== 'unknown') {
    const kind =
      number.status === 'unconnected'
        ? number.visible && number.canConnect
          ? 'connect'
          : null
        : number.status === 'preparing'
          ? 'setup'
          : number.status === 'disconnected'
            ? 'reconnect'
            : number.status === 'attention' || number.status === 'partial'
              ? number.status
              : null
    if (kind) {
      return {
        kind,
        tone: kind === 'connect' ? 'critical' : 'warning',
        remaining: ownRemaining,
      }
    }
  }
  const banner = resolveUsageBanner(used, limit)
  if (!banner) return null
  return {
    ...banner,
    kind: banner.tone === 'critical' ? 'exhausted' : 'low',
  }
}

export function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)))
}

export interface RecommendablePlan {
  id: string
  amount: number
  includedVerifications: number
  /** The plan's own-number pool, from the API. Each plan sets its own. */
  ownNumberIncludedVerifications?: number
}

function paidBySize<T extends RecommendablePlan>(plans: readonly T[]): T[] {
  return plans
    .filter((plan) => plan.amount > 0)
    .sort((a, b) => a.includedVerifications - b.includedVerifications)
}

/** The last 30 days by the plan pool that paid for each message. */
export interface SentByPool {
  akeed: number
  ownNumber: number
}

/**
 * Whether a plan covers the volume with 1.5 times headroom. Without pool
 * figures every message counts against the Akeed allowance. With them, each
 * pool covers what it paid for, using that plan's own pool sizes: own-number
 * messages beyond the own-number pool spill into the Akeed pool, as sends from
 * a healthy number do.
 */
export function planCovers(
  plan: RecommendablePlan,
  messagesSentLast30Days: number,
  byPool?: SentByPool | null
): boolean {
  if (!byPool)
    return (
      plan.includedVerifications >=
      messagesSentLast30Days * RECOMMENDATION_HEADROOM
    )
  const ownPool = plan.ownNumberIncludedVerifications ?? 0
  const overflow = Math.max(
    byPool.ownNumber * RECOMMENDATION_HEADROOM - ownPool,
    0
  )
  return (
    plan.includedVerifications >=
    byPool.akeed * RECOMMENDATION_HEADROOM + overflow
  )
}

/**
 * The smallest paid plan that covers the messages sent in the last 30 days
 * with 1.5 times headroom, which leaves room for follow-ups. Without history
 * there is nothing to base a recommendation on, so there is none; volume
 * above every plan means the largest one.
 */
export function recommendPlan(
  plans: readonly RecommendablePlan[],
  messagesSentLast30Days: number,
  byPool?: SentByPool | null
): string | null {
  const paid = paidBySize(plans)
  if (paid.length === 0 || messagesSentLast30Days <= 0) return null

  return (
    paid.find((plan) => planCovers(plan, messagesSentLast30Days, byPool))?.id ??
    paid[paid.length - 1].id
  )
}

/**
 * The one plan whose button is primary: the recommended plan, or the next
 * plan up when the store is already on it. Without a recommendation, or on
 * the largest plan, it is the smallest paid plan the store is not on.
 */
export function resolvePrimaryPlanId(
  plans: readonly RecommendablePlan[],
  currentPlanId: string | null,
  recommendedPlanId: string | null
): string | null {
  const paid = paidBySize(plans)
  const others = paid.filter((plan) => plan.id !== currentPlanId)
  if (others.length === 0) return null
  if (recommendedPlanId && recommendedPlanId !== currentPlanId) {
    return recommendedPlanId
  }
  if (recommendedPlanId) {
    const current = paid.findIndex((plan) => plan.id === currentPlanId)
    return paid[current + 1]?.id ?? others[0].id
  }
  return others[0].id
}
