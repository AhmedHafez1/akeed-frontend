import type {
  DashboardStats,
  VerificationStatus,
  VerificationStatusFilter,
} from '../model/dashboard.model'

export type VerificationWorkloadId =
  | 'all'
  | 'inProgress'
  | 'needsAttention'
  | 'completed'

interface WorkloadGroup {
  id: VerificationWorkloadId
  statuses: readonly VerificationStatus[]
  filter: VerificationStatusFilter
  value: (totals: DashboardStats['totals']) => number
}

const WORKLOAD_GROUPS: readonly WorkloadGroup[] = [
  { id: 'all', statuses: [], filter: 'all', value: (totals) => totals.total },
  {
    id: 'inProgress',
    statuses: ['pending', 'sent', 'delivered', 'read'],
    filter: 'in_progress',
    value: (totals) => totals.in_progress,
  },
  {
    id: 'needsAttention',
    statuses: ['failed', 'expired', 'no_reply'],
    filter: 'needs_attention',
    value: (totals) => totals.needs_attention,
  },
  {
    id: 'completed',
    statuses: ['confirmed', 'canceled'],
    filter: 'completed',
    // These three groups partition the nine current statuses. Timestamp-based
    // confirmed/canceled counters can also include earlier lifecycle outcomes.
    value: (totals) =>
      totals.total - totals.in_progress - totals.needs_attention,
  },
]

const ATTENTION_STATUSES: ReadonlySet<VerificationStatus> = new Set([
  'failed',
  'expired',
  'no_reply',
])

export function isAttentionVerification(status: VerificationStatus): boolean {
  return ATTENTION_STATUSES.has(status)
}

export function getVerificationWorkload(stats: DashboardStats | null) {
  return WORKLOAD_GROUPS.map((group) => ({
    id: group.id,
    filter: group.filter,
    value: stats ? group.value(stats.totals) : null,
  }))
}
