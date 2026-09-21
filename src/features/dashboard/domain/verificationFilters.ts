import type {
  DashboardStatsDateRange,
  LifecycleStatus,
  VerificationStatus,
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

export type OutcomeFilter =
  | 'confirmed'
  | 'canceled'
  | 'in_progress'
  | 'needs_attention'

/**
 * The four outcomes a verification lands in, and the lifecycle stages each
 * one can be narrowed to.
 *
 * The stages partition their outcome exactly — every status belongs to one
 * outcome and no stage reaches outside it — so narrowing a list never shows a
 * row the outcome above it did not already count. `awaiting_response` is not
 * a stage for that reason: it includes `no_reply`, which is needs-attention.
 */
export const OUTCOME_STAGES: Readonly<
  Record<OutcomeFilter, readonly VerificationStatus[]>
> = {
  confirmed: [],
  canceled: [],
  in_progress: ['pending', 'sent', 'delivered', 'read'],
  needs_attention: ['failed', 'expired', 'no_reply'],
}

export const OUTCOME_FILTER_IDS = [
  'confirmed',
  'canceled',
  'in_progress',
  'needs_attention',
] as const satisfies ReadonlyArray<OutcomeFilter>

/** Every filter the standalone list can be deep-linked to. */
export const STANDALONE_STATUS_FILTER_IDS: ReadonlyArray<VerificationStatusFilter> =
  [
    ...new Set<VerificationStatusFilter>([
      ...VERIFICATION_STATUS_FILTER_IDS,
      ...OUTCOME_FILTER_IDS,
      ...OUTCOME_FILTER_IDS.flatMap((outcome) => OUTCOME_STAGES[outcome]),
    ]),
  ]

/**
 * The outcome a filter sits under: itself for an outcome, the parent for a
 * stage, and null for `all` or a filter that spans outcomes.
 */
export function outcomeOfFilter(
  filter: VerificationStatusFilter
): OutcomeFilter | null {
  return (
    OUTCOME_FILTER_IDS.find(
      (outcome) =>
        outcome === filter ||
        (OUTCOME_STAGES[outcome] as readonly string[]).includes(filter)
    ) ?? null
  )
}

/**
 * Filters that stand for several underlying statuses.
 *
 * `awaiting_response` covers everything sent but unanswered, including a
 * no-reply escalation, which is still awaiting an answer even though it also
 * has its own tab. The two outcome composites are spelled from their stages so
 * the list an outcome filters to can never drift from what it narrows into.
 */
const COMPOSITE_FILTERS: Partial<Record<VerificationStatusFilter, string>> = {
  in_progress: OUTCOME_STAGES.in_progress.join(','),
  awaiting_response: 'sent,delivered,read,no_reply',
  needs_attention: OUTCOME_STAGES.needs_attention.join(','),
}

/** Whether a row in `status` belongs in the list for `filter`. */
export function filterAdmitsStatus(
  filter: VerificationStatusFilter,
  status: LifecycleStatus
): boolean {
  if (filter === 'all') return true
  const composite = COMPOSITE_FILTERS[filter]
  return composite ? composite.split(',').includes(status) : filter === status
}

/**
 * Rows fetched per request.
 *
 * Sent explicitly rather than left to the server's default so the size the
 * table pages by is decided where the table is, and cannot drift when the
 * server's default moves. A screenful: the list grows by Load-more, and each
 * row carries its order with it.
 */
export const VERIFICATIONS_PAGE_SIZE = 20

/**
 * What narrows a listing request.
 *
 * An options object rather than positional arguments because this is the seam
 * sorting and search arrive through — each is one more optional field here and
 * one more `params.set`, with no call site to re-thread.
 */
export interface VerificationsQueryParams {
  statusFilter: VerificationStatusFilter
  dateRange: DashboardStatsDateRange
  limit?: number
  /** Narrow the list to the orders one import batch created. */
  importBatchId?: string
}

/** Build the `/api/verifications` query string for a filter selection. */
export function buildVerificationsQuery({
  statusFilter,
  dateRange,
  limit = VERIFICATIONS_PAGE_SIZE,
  importBatchId,
}: VerificationsQueryParams): string {
  const params = new URLSearchParams({
    date_range: dateRange,
    limit: String(limit),
  })
  const composite = COMPOSITE_FILTERS[statusFilter]

  if (composite) {
    params.set('status', composite)
  } else if (statusFilter !== 'all') {
    params.set('status', statusFilter)
  }
  if (importBatchId) params.set('importBatchId', importBatchId)

  return `?${params.toString()}`
}
