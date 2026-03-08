import type { VerificationStatus } from '../../model/dashboard.model'

const STATUS_COLORS = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  sent: 'bg-amber-100 text-amber-700',
  delivered: 'bg-blue-100 text-blue-700',
  read: 'bg-blue-100 text-blue-700',
  canceled: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
  expired: 'bg-slate-100 text-slate-700',
} as const satisfies Record<VerificationStatus, string>

interface StatusBadgeProps {
  status: VerificationStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700'

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${color}`}
    >
      {status}
    </span>
  )
}
