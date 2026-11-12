/** Shopify-only read-only readiness reported by the existing onboarding API. */
export interface SendingAvailability {
  available: boolean
  reason: string | null
  billingStatus: string | null
  planState:
    | 'none'
    | 'active'
    | 'cancelled'
    | 'frozen'
    | 'paid_through'
    | 'inactive'
  currentPlanId: 'starter' | 'basic' | 'pro' | 'business' | null
  lastPlanId: 'starter' | 'basic' | 'pro' | 'business' | null
  lastPlanName: string | null
  cancelledAt: string | null
  paidThroughAt: string | null
  missedOrders: { count: number; since: string; until: string } | null
}
