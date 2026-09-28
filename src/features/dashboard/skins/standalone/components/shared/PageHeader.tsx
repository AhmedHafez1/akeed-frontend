'use client'

import { useId, type ReactNode } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronDown, Coins } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { useBillingSummary } from '@/features/billing/domain/useBillingSummary'
import type { DateRangeFilterOption } from '@/features/dashboard/domain/dashboard.types'
import { formatCount } from '@/features/dashboard/lib/orderDisplay'
import type { DashboardStatsDateRange } from '@/features/dashboard/model/dashboard.model'

interface PageHeaderProps {
  title: ReactNode
  /** A line of text, or richer content such as the settings chips. */
  subtitle?: ReactNode
  periodLabel: string
  period: DashboardStatsDateRange
  periodOptions: ReadonlyArray<DateRangeFilterOption>
  onPeriodChange: (period: DashboardStatsDateRange) => void
}

/**
 * The period, as a native select dressed as a control: a calendar at the
 * start, a chevron at the end. Native so keyboard, screen readers and phones
 * get their own picker for free; the label is kept for assistive tech only.
 */
function PeriodSelect({
  label,
  period,
  options,
  onChange,
}: {
  label: string
  period: DashboardStatsDateRange
  options: ReadonlyArray<DateRangeFilterOption>
  onChange: (period: DashboardStatsDateRange) => void
}) {
  const id = useId()
  return (
    <div className="relative min-w-44 flex-1 sm:flex-none">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <CalendarDays
        aria-hidden="true"
        className="text-ink-muted pointer-events-none absolute start-3 top-1/2 size-[18px] -translate-y-1/2"
      />
      <select
        id={id}
        value={period}
        onChange={(event) =>
          onChange(event.target.value as DashboardStatsDateRange)
        }
        className="ak-focus border-control-border bg-surface-raised text-ink text-ak-body rounded-ak-control h-10 w-full cursor-pointer appearance-none border ps-10 pe-9 font-medium sm:w-auto sm:min-w-48"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-ink-muted pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
      />
    </div>
  )
}

/**
 * The credit balance and the way to add more, as one split chip:
 * `96 message credits | Top up`. Hidden when billing can't answer — the
 * billing page is where a real error belongs, not every page header.
 */
function CreditsChip() {
  const t = useTranslations('dashboard.standalone.header')
  const { locale } = useLocaleInfo()
  const { summary, isLoading, error } = useBillingSummary()

  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className="bg-neutral-soft rounded-ak-control inline-block h-10 w-56 animate-pulse"
      />
    )
  }
  if (error || !summary || summary.status === 'not_provisioned') return null
  const count = summary.availableCredits

  return (
    <div className="border-brand-line bg-brand-soft text-brand-ink rounded-ak-control text-ak-body inline-flex h-10 shrink-0 items-stretch border">
      <p className="flex items-center gap-2 px-3 whitespace-nowrap">
        <Coins aria-hidden="true" className="size-[18px] shrink-0" />
        <span aria-hidden="true">
          <bdi className="font-bold tabular-nums">
            {formatCount(count, locale)}
          </bdi>{' '}
          {t('credits', { count })}
        </span>
        <span className="sr-only">{t('creditsLabel', { count })}</span>
      </p>
      <Link
        href={withLocale('/billing', locale)}
        aria-label={t('topUpLabel')}
        className="ak-focus border-brand-line hover:bg-surface-raised/60 flex items-center rounded-e-[calc(var(--radius-ak-control)-1px)] border-s px-3 font-semibold whitespace-nowrap transition-colors"
      >
        {t('topUp')}
      </Link>
    </div>
  )
}

/**
 * Title and one line under it at the start; the period and credits at the
 * end. Shared by Overview and Confirmations so both pages open the same way.
 */
export function PageHeader({
  title,
  subtitle,
  periodLabel,
  period,
  periodOptions,
  onPeriodChange,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        <h1 className="text-ak-title text-ink">{title}</h1>
        {typeof subtitle === 'string' ? (
          <p className="text-ak-body text-ink-muted">{subtitle}</p>
        ) : (
          subtitle
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap lg:shrink-0 lg:justify-end">
        <PeriodSelect
          label={periodLabel}
          period={period}
          options={periodOptions}
          onChange={onPeriodChange}
        />
        <CreditsChip />
      </div>
    </header>
  )
}
