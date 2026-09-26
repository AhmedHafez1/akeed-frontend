'use client'

import { useId, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DateRangeFilterOption } from '@/features/dashboard/domain/dashboard.types'
import type { DashboardStatsDateRange } from '@/features/dashboard/model/dashboard.model'

interface StandalonePageHeaderProps {
  title: ReactNode
  /** A line of text, or richer content such as the settings status line. */
  subtitle?: ReactNode
  periodLabel: string
  period: DashboardStatsDateRange
  periodOptions: ReadonlyArray<DateRangeFilterOption>
  onPeriodChange: (period: DashboardStatsDateRange) => void
  /** Extra controls beside the period, such as the credits badge. */
  actions?: ReactNode
}

/**
 * Title and subtitle at the start, the labelled period select and page
 * actions at the end — the standalone twin of the embedded page header, so
 * both modes open every page the same way.
 */
export function StandalonePageHeader({
  title,
  subtitle,
  periodLabel,
  period,
  periodOptions,
  onPeriodChange,
  actions,
}: StandalonePageHeaderProps) {
  const selectId = useId()

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-2">
        <h1 className="text-h2 text-foreground">{title}</h1>
        {typeof subtitle === 'string' ? (
          <p className="text-body text-muted-foreground">{subtitle}</p>
        ) : (
          subtitle
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
          <label
            htmlFor={selectId}
            className="text-muted-foreground shrink-0 text-sm"
          >
            {periodLabel}
          </label>
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <select
              id={selectId}
              value={period}
              onChange={(event) =>
                onPeriodChange(event.target.value as DashboardStatsDateRange)
              }
              className="border-input bg-card text-foreground focus:border-primary focus:ring-primary-border rounded-control h-10 w-full appearance-none border py-2 ps-3 pe-10 text-sm font-medium transition focus:ring-2 focus:outline-none sm:w-auto sm:min-w-44"
            >
              {periodOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
            />
          </div>
        </div>
        {actions}
      </div>
    </header>
  )
}
