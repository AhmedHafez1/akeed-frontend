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

export function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)))
}

export interface RecommendablePlan {
  id: string
  amount: number
  includedVerifications: number
}

function paidBySize<T extends RecommendablePlan>(plans: readonly T[]): T[] {
  return plans
    .filter((plan) => plan.amount > 0)
    .sort((a, b) => a.includedVerifications - b.includedVerifications)
}

/**
 * The smallest paid plan whose monthly allowance is at least 1.5 times the
 * messages sent in the last 30 days, which leaves room for follow-ups. Without
 * history there is nothing to base a recommendation on, so there is none;
 * volume above every plan means the largest one.
 */
export function recommendPlan(
  plans: readonly RecommendablePlan[],
  messagesSentLast30Days: number
): string | null {
  const paid = paidBySize(plans)
  if (paid.length === 0 || messagesSentLast30Days <= 0) return null

  const target = messagesSentLast30Days * RECOMMENDATION_HEADROOM
  return (
    paid.find((plan) => plan.includedVerifications >= target)?.id ??
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
