'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
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

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {t('title')}
        </h1>
        <p className="text-sm text-slate-500">{t('valueProposition')}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative flex items-center gap-2 text-sm text-slate-500">
          <span className="sr-only">{t('filters.dateRange.label')}</span>
          <select
            value={dateRangeFilter}
            onChange={(event) =>
              onDateRangeFilterChange(
                event.target.value as DashboardStatsDateRange
              )
            }
            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 ps-3 pe-10 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
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
