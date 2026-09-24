/**
 * Plan-tab rules: the credits banner thresholds and the recommended plan.
 * Both are pure so the thresholds and sizing are pinned by unit tests.
 */

export const USAGE_WARNING_RATIO = 0.8
/** A plan should cover this many times the store's recent monthly volume. */
export const RECOMMENDATION_HEADROOM = 3
export const FALLBACK_RECOMMENDED_PLAN_ID = 'basic'

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

/**
 * The smallest paid plan whose monthly allowance is at least three times the
 * messages sent in the last 30 days. No history means Basic; volume above
 * every plan means the largest one.
 */
export function recommendPlan(
  plans: readonly RecommendablePlan[],
  messagesSentLast30Days: number
): string | null {
  const paid = plans
    .filter((plan) => plan.amount > 0)
    .sort((a, b) => a.includedVerifications - b.includedVerifications)
  if (paid.length === 0) return null

  if (messagesSentLast30Days <= 0) {
    return (
      paid.find((plan) => plan.id === FALLBACK_RECOMMENDED_PLAN_ID)?.id ??
      paid[0].id
    )
  }

  const target = messagesSentLast30Days * RECOMMENDATION_HEADROOM
  return (
    paid.find((plan) => plan.includedVerifications >= target)?.id ??
    paid[paid.length - 1].id
  )
}
