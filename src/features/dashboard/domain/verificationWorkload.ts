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
  filter: VerificationStatusFilter | null
  value: (totals: DashboardStats['totals']) => number
}

// The existing awaiting_response filter also includes no_reply, so it cannot
// stand in for inProgress. Only All has an exact existing filter.
const WORKLOAD_GROUPS: readonly WorkloadGroup[] = [
  { id: 'all', statuses: [], filter: 'all', value: (totals) => totals.total },
  {
    id: 'inProgress',
    statuses: ['pending', 'sent', 'delivered', 'read'],
    filter: null,
    value: (totals) => totals.in_progress,
  },
  {
    id: 'needsAttention',
    statuses: ['failed', 'expired', 'no_reply'],
    filter: null,
    value: (totals) => totals.needs_attention,
  },
  {
    id: 'completed',
    statuses: ['confirmed', 'canceled'],
    filter: null,
    // These three groups partition the nine current statuses. Timestamp-based
    // confirmed/canceled counters can also include earlier lifecycle outcomes.
    value: (totals) =>
      totals.total - totals.in_progress - totals.needs_attention,
  },
]

export function getVerificationWorkload(stats: DashboardStats | null) {
  return WORKLOAD_GROUPS.map((group) => ({
    id: group.id,
    filter: group.filter,
    value: stats ? group.value(stats.totals) : null,
  }))
}
