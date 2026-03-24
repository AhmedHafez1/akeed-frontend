import type { VerificationStatus } from '../../model/dashboard.model'
import { useTranslations } from 'next-intl'

const STATUS_COLORS = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  sent: 'bg-blue-100 text-blue-700',
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
  const t = useTranslations('dashboard')
  const color = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700'

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${color}`}
    >
      {t(`verificationStatus.${status}`)}
    </span>
  )
}
