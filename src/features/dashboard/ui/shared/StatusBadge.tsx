import type { VerificationStatus } from '../../model/dashboard.model'
import { useTranslations } from 'next-intl'

const STATUS_COLORS = {
  pending: 'border-slate-200 bg-slate-50 text-slate-700',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  sent: 'border-blue-200 bg-blue-50 text-blue-700',
  delivered: 'border-blue-200 bg-blue-50 text-blue-700',
  read: 'border-blue-200 bg-blue-50 text-blue-700',
  canceled: 'border-red-200 bg-red-50 text-red-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
  expired: 'border-slate-200 bg-slate-50 text-slate-700',
  no_reply: 'border-amber-200 bg-amber-50 text-amber-800',
} as const satisfies Record<VerificationStatus, string>

interface StatusBadgeProps {
  status: VerificationStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('dashboard')
  const color =
    STATUS_COLORS[status] ?? 'border-slate-200 bg-slate-50 text-slate-700'

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {t(`verificationStatus.${status}`)}
    </span>
  )
}
