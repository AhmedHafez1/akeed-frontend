'use client'

import { CircleAlert, CircleCheck, Clock3, ListChecks } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { getVerificationWorkload } from '@/features/dashboard/domain/verificationWorkload'
import type { VerificationWorkloadId } from '@/features/dashboard/domain/verificationWorkload'
import type { DashboardSkinProps } from '@/features/dashboard/domain/dashboard.types'

const icons = {
  all: ListChecks,
  inProgress: Clock3,
  needsAttention: CircleAlert,
  completed: CircleCheck,
}
const tones: Record<VerificationWorkloadId, string> = {
  all: 'bg-emerald-50 text-emerald-700',
  inProgress: 'bg-slate-100 text-slate-600',
  needsAttention: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
}

export function StandaloneVerificationWorkload({
  stats,
  isStatsLoading,
  dateRangeFilter,
  statusFilter,
  onStatusFilterChange,
}: Pick<
  DashboardSkinProps,
  | 'stats'
  | 'isStatsLoading'
  | 'dateRangeFilter'
  | 'statusFilter'
  | 'onStatusFilterChange'
>) {
  const t = useTranslations('dashboard.verifications.workload')
  const { locale } = useLocaleInfo()
  const currentStats = stats?.date_range === dateRangeFilter ? stats : null
  return (
    <section
      aria-label={t('label')}
      aria-busy={isStatsLoading}
      className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5"
    >
      {getVerificationWorkload(currentStats).map((group) => {
        const Icon = icons[group.id]
        const filter = group.filter
        const selected = group.filter !== null && statusFilter === group.filter
        const className = `flex h-full items-start gap-3 rounded-xl border bg-white p-4 text-start shadow-sm ${selected ? 'border-emerald-500 ring-1 ring-emerald-500/10' : 'border-slate-200'}`
        const content = (
          <>
            <span
              className={`hidden rounded-xl p-2.5 min-[400px]:inline-flex ${tones[group.id]}`}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 sm:text-sm">
                {t(group.id)}
              </p>
              {isStatsLoading ? (
                <span
                  className="mt-2 block h-7 w-14 animate-pulse rounded bg-slate-100"
                  aria-label={t('loading')}
                />
              ) : (
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
                  {group.value === null
                    ? '—'
                    : new Intl.NumberFormat(locale).format(group.value)}
                </p>
              )}
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                {t(`${group.id}Hint`)}
              </p>
            </div>
          </>
        )
        return filter !== null ? (
          <button
            key={group.id}
            type="button"
            aria-pressed={selected}
            aria-label={t(group.id)}
            onClick={() => onStatusFilterChange(filter)}
            className={`${className} transition-colors hover:bg-emerald-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600`}
          >
            {content}
          </button>
        ) : (
          <div key={group.id} className={className}>
            {content}
          </div>
        )
      })}
    </section>
  )
}
