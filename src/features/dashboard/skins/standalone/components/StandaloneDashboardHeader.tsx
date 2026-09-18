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
  availableCredit?: ReactNode
}

export function StandaloneDashboardHeader({
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  availableCredit,
}: StandaloneDashboardHeaderProps) {
  const t = useTranslations('dashboard')
  const { identity, isIdentityLoading } = useStandaloneShell()
  const heading = identity.fullName
    ? t('standalone.greeting', { name: identity.fullName })
    : t('title')

  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-foreground flex items-center gap-2 text-3xl leading-tight font-bold tracking-tight">
          {isIdentityLoading ? (
            <span
              aria-label={t('standalone.greetingLoading')}
              className="bg-border inline-block h-10 w-64 max-w-full animate-pulse rounded-lg align-middle"
            />
          ) : (
            <>{heading}</>
          )}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-muted-foreground relative min-w-0 flex-1 text-sm sm:flex-none">
          <span className="sr-only">{t('filters.dateRange.label')}</span>
          <select
            value={dateRangeFilter}
            onChange={(event) =>
              onDateRangeFilterChange(
                event.target.value as DashboardStatsDateRange
              )
            }
            className="border-input bg-card text-foreground/80 focus:border-primary focus:ring-primary-border h-10 w-full appearance-none rounded-lg border py-2 ps-3 pe-10 text-sm font-medium shadow-sm transition focus:ring-2 focus:outline-none sm:w-auto"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2"
          />
        </label>
        {availableCredit}
      </div>
    </header>
  )
}
