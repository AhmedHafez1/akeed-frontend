'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { useStandaloneShell } from '@/shared/layout/StandaloneShellContext'
import type { DateRangeFilterOption } from '@/features/dashboard/domain/dashboard.types'
import type { DashboardStatsDateRange } from '@/features/dashboard/model/dashboard.model'

interface StandaloneDashboardHeaderProps {
  dateRangeFilter: DashboardStatsDateRange
  dateRangeOptions: ReadonlyArray<DateRangeFilterOption>
  onDateRangeFilterChange: (filter: DashboardStatsDateRange) => void
  action?: ReactNode
}

export function StandaloneDashboardHeader({
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  action,
}: StandaloneDashboardHeaderProps) {
  const t = useTranslations('dashboard')
  const { identity, isIdentityLoading } = useStandaloneShell()
  const heading = identity.fullName
    ? t('standalone.greeting', { name: identity.fullName })
    : t('title')

  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-1.5">
        <p className="text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">
          {t('standalone.eyebrow')}
        </p>
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-slate-950 lg:text-4xl">
          {isIdentityLoading ? (
            <span
              aria-label={t('standalone.greetingLoading')}
              className="inline-block h-10 w-64 max-w-full animate-pulse rounded-lg bg-stone-200 align-middle"
            />
          ) : (
            heading
          )}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          {t('standalone.description')}
        </p>
      </div>

      <div className="flex w-full flex-wrap items-start gap-3 md:w-auto md:items-end md:justify-end">
        <label className="relative min-w-0 flex-1 text-sm text-slate-500 sm:flex-none">
          <span className="sr-only">{t('filters.dateRange.label')}</span>
          <select
            value={dateRangeFilter}
            onChange={(event) =>
              onDateRangeFilterChange(
                event.target.value as DashboardStatsDateRange
              )
            }
            className="h-10 w-full appearance-none rounded-lg border border-stone-300 bg-white py-2 ps-3 pe-10 text-sm font-medium text-slate-700 shadow-sm transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none sm:w-auto"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          />
        </label>
        {action}
      </div>
    </header>
  )
}
