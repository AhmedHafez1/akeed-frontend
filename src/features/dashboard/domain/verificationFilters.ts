import type {
  DashboardStatsDateRange,
  VerificationStatusFilter,
} from '../model/dashboard.model'

/**
 * The single filter vocabulary both runtime modes render.
 *
 * These lived twice — seven embedded tabs against five standalone ones — and
 * had already disagreed: `no_reply` counted as "awaiting response" in one mode
 * and "needs attention" in the other, so the same row was filed under opposite
 * meanings depending on where a merchant looked at it.
 */
export const VERIFICATION_STATUS_FILTER_IDS = [
  'all',
  'pending',
  'awaiting_response',
  'confirmed',
  'canceled',
  'failed',
  'no_reply',
] as const satisfies ReadonlyArray<VerificationStatusFilter>

export const DASHBOARD_DATE_RANGE_IDS = [
  'today',
  'last_7_days',
  'last_30_days',
  'last_3_months',
] as const satisfies ReadonlyArray<DashboardStatsDateRange>

/**
 * Filters that stand for several underlying statuses.
 *
 * `awaiting_response` covers everything sent but unanswered, including a
 * no-reply escalation, which is still awaiting an answer even though it also
 * has its own tab.
 */
const COMPOSITE_FILTERS: Partial<Record<VerificationStatusFilter, string>> = {
  awaiting_response: 'sent,delivered,read,no_reply',
}

/** Build the `/api/verifications` query string for a filter selection. */
export function buildVerificationsQuery(
  statusFilter: VerificationStatusFilter,
  dateRange: DashboardStatsDateRange
): string {
  const params = new URLSearchParams({ date_range: dateRange })
  const composite = COMPOSITE_FILTERS[statusFilter]

  if (composite) {
    params.set('status', composite)
  } else if (statusFilter !== 'all') {
    params.set('status', statusFilter)
  }

  return `?${params.toString()}`
}
