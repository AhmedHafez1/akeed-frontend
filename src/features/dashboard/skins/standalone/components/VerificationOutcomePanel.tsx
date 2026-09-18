'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui'
import {
  OUTCOME_FILTER_IDS,
  outcomeOfFilter,
} from '@/features/dashboard/domain/verificationFilters'
import type { OutcomeFilter } from '@/features/dashboard/domain/verificationFilters'
import {
  formatDashboardNumber,
  formatDashboardPercent,
} from '@/features/dashboard/lib/dashboardFormatters'
import type {
  DashboardStats,
  DashboardStatsDateRange,
  VerificationStatusFilter,
} from '@/features/dashboard/model/dashboard.model'

/** Each outcome's label, under the `dashboard` namespace. */
export const OUTCOME_LABEL_KEYS: Readonly<Record<OutcomeFilter, string>> = {
  confirmed: 'verifications.metrics.confirmed',
  canceled: 'verifications.metrics.canceled',
  in_progress: 'verifications.metrics.inProgress',
  needs_attention: 'verifications.metrics.needsAttention',
}

const OUTCOME_VALUES: Readonly<
  Record<OutcomeFilter, (totals: DashboardStats['totals']) => number>
> = {
  confirmed: (totals) => totals.confirmed,
  canceled: (totals) => totals.canceled,
  in_progress: (totals) => totals.in_progress,
  needs_attention: (totals) => totals.needs_attention,
}

const OUTCOME_TONES: Readonly<
  Record<OutcomeFilter, { stroke: string; dot: string; bar: string }>
> = {
  confirmed: {
    stroke: 'stroke-primary',
    dot: 'bg-primary',
    bar: 'before:bg-primary',
  },
  canceled: {
    stroke: 'stroke-destructive',
    dot: 'bg-destructive',
    bar: 'before:bg-destructive',
  },
  in_progress: {
    stroke: 'stroke-input',
    dot: 'bg-muted-foreground',
    bar: 'before:bg-muted-foreground',
  },
  needs_attention: {
    stroke: 'stroke-secondary',
    dot: 'bg-secondary',
    bar: 'before:bg-secondary',
  },
}

interface OutcomeSlice {
  filter: OutcomeFilter
  label: string
  /** Null while no figures are known for the selected range. */
  value: number | null
  stroke: string
  dot: string
  bar: string
}

interface VerificationOutcomePanelProps {
  stats: DashboardStats | null
  /** Accessible name for the section. */
  label: string
  /** Draws the outcome donut beside the total. */
  showChart?: boolean
  /**
   * The range the page is showing. Given, figures for any other range are
   * withheld rather than shown as if they belonged to this one.
   */
  dateRangeFilter?: DashboardStatsDateRange
  isLoading?: boolean
  /**
   * Given, the figures filter the list on the same page. Omitted, each figure
   * links to the verifications list filtered to its outcome.
   */
  statusFilter?: VerificationStatusFilter
  onStatusFilterChange?: (filter: VerificationStatusFilter) => void
}

/**
 * Total, outcome donut and per-outcome figures as a single statement.
 *
 * These were two cards side by side printing the same three counts: a total
 * with a breakdown, next to a breakdown with a chart. One surface, read once —
 * and the only element on the screen at display scale, so the eye has
 * somewhere to land before it starts scanning.
 *
 * The overview reads it with the donut and links out of it; the verifications
 * list reads the same figures without the donut and filters by them in place,
 * so an outcome is counted and named identically wherever a merchant meets it.
 */
export function VerificationOutcomePanel({
  stats,
  label,
  showChart = false,
  dateRangeFilter,
  isLoading = false,
  statusFilter,
  onStatusFilterChange,
}: VerificationOutcomePanelProps) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()

  // A response still on screen from the previous range is not a figure for
  // this one: showing it would put last month's count beside today's list.
  const current =
    stats && (!dateRangeFilter || stats.date_range === dateRangeFilter)
      ? stats
      : null
  const isPending = isLoading && !current
  const selectedOutcome = statusFilter ? outcomeOfFilter(statusFilter) : null

  const outcomes: OutcomeSlice[] = OUTCOME_FILTER_IDS.map((filter) => ({
    filter,
    label: t(OUTCOME_LABEL_KEYS[filter]),
    value: current ? OUTCOME_VALUES[filter](current.totals) : null,
    ...OUTCOME_TONES[filter],
  }))

  const outcomeTotal = outcomes.reduce(
    (sum, outcome) => sum + (outcome.value ?? 0),
    0
  )
  const chartStats = showChart ? current : null

  return (
    <section
      aria-label={label}
      aria-busy={isPending}
      className={cn(
        'rounded-panel from-muted/40 to-card grid overflow-hidden border bg-linear-to-b',
        chartStats && 'sm:grid-cols-[minmax(0,1fr)_auto]'
      )}
    >
      <div className="flex min-w-0 flex-col">
        <div className="px-5 py-5 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-2.5">
            <span className="border-input text-foreground bg-card flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
              <Package aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-foreground text-base font-bold">
                {t('verifications.metrics.total')}
              </h2>
              <p className="text-caption text-muted-foreground">
                {t('standalone.outcomes.description')}
              </p>
            </div>
          </div>

          {isPending ? (
            <Skeleton className="mt-5 h-12 w-24 sm:h-15 sm:w-32" />
          ) : (
            <p className="text-foreground mt-5 text-5xl font-extrabold tabular-nums sm:text-6xl">
              {current
                ? formatDashboardNumber(current.totals.total, locale)
                : '—'}
            </p>
          )}

          {current && outcomeTotal === 0 && (
            <p className="bg-muted text-foreground/70 mt-5 rounded-xl p-3 text-sm">
              {t('standalone.outcomes.empty')}
            </p>
          )}
        </div>

        <ul
          role="list"
          className="border-border bg-muted mt-auto grid gap-px border-t sm:grid-cols-2 lg:grid-cols-4"
        >
          {outcomes.map((outcome) => {
            const selected = selectedOutcome === outcome.filter
            return (
              <li key={outcome.filter} className="flex min-w-0">
                <OutcomeFigure
                  outcome={outcome}
                  total={outcomeTotal}
                  locale={locale}
                  isPending={isPending}
                  selected={selected}
                  onSelect={
                    onStatusFilterChange &&
                    (() =>
                      onStatusFilterChange(selected ? 'all' : outcome.filter))
                  }
                />
              </li>
            )
          })}
        </ul>
      </div>

      {chartStats && (
        <div className="border-border flex items-center justify-center border-t p-5 sm:border-s sm:border-t-0 sm:px-10 sm:py-6 lg:px-14">
          <OutcomeDonut
            outcomes={outcomes}
            total={outcomeTotal}
            label={t('standalone.outcomes.chartLabel')}
            locale={locale}
          />
        </div>
      )}
    </section>
  )
}

/**
 * The outcome split as a donut beside the total.
 *
 * Each slice is a stroke-dash arc on a circle whose circumference is 100, so a
 * slice's share maps straight onto its dash length. With nothing to split the
 * ring stays as a quiet track rather than disappearing and shifting the layout.
 */
function OutcomeDonut({
  outcomes,
  total,
  label,
  locale,
}: {
  outcomes: OutcomeSlice[]
  total: number
  label: string
  locale: string
}) {
  const radius = 100 / (2 * Math.PI)
  const visible = outcomes.flatMap((outcome) =>
    outcome.value !== null && outcome.value > 0
      ? [{ outcome, value: outcome.value }]
      : []
  )

  const shares = visible.map(({ value }) => (value / total) * 100)
  const slices = visible.map(({ outcome, value }, index) => {
    const share = shares[index]
    const start = shares.slice(0, index).reduce((sum, prior) => sum + prior, 0)
    return { outcome, value, share, start }
  })

  // The ring's radius as a share of the box, for placing the HTML labels
  // centred on each arc.
  const labelRadius = (radius / 42) * 100

  return (
    <div className="relative h-40 w-40 shrink-0 sm:h-52 sm:w-52">
      <svg
        viewBox="0 0 42 42"
        role="img"
        aria-label={label}
        className="h-full w-full -rotate-90"
      >
        <circle
          cx="21"
          cy="21"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-border"
        />
        {slices.map(({ outcome, value, start, share }) => (
          <circle
            key={outcome.filter}
            cx="21"
            cy="21"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeDasharray={`${share} ${100 - share}`}
            strokeDashoffset={-start}
            className={cn('transition-[stroke-dasharray]', outcome.stroke)}
          >
            <title>{`${outcome.label}: ${value}`}</title>
          </circle>
        ))}
      </svg>

      {slices.map(({ outcome, share, start }) => {
        // Too narrow a slice has no room for a badge; its figure is below.
        if (share < 5) return null
        const angle = ((start + share / 2) / 100) * 2 * Math.PI
        return (
          <span
            key={outcome.filter}
            aria-hidden="true"
            className="border-border bg-card text-foreground absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums shadow-sm"
            style={{
              left: `${50 + labelRadius * Math.sin(angle)}%`,
              top: `${50 - labelRadius * Math.cos(angle)}%`,
            }}
          >
            {formatDashboardPercent(Math.round(share), locale)}
          </span>
        )
      })}
    </div>
  )
}

const figurePadding = 'px-5 py-3.5 sm:px-6 sm:py-4'
const figureInteraction =
  'transition hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset'

/**
 * One outcome as a figure, linked to — or filtering — the list it stands for.
 *
 * A zero is rendered quiet and inert on purpose: an outcome with nothing behind
 * it should neither compete for attention nor promise a page of rows that turns
 * out to be empty. The one exception is a zero that is already selected, which
 * stays pressable so the filter it set can be lifted from where it was set.
 */
function OutcomeFigure({
  outcome,
  total,
  locale,
  isPending,
  selected,
  onSelect,
}: {
  outcome: OutcomeSlice
  total: number
  locale: string
  isPending: boolean
  selected: boolean
  onSelect?: () => void
}) {
  const t = useTranslations('dashboard')
  const isEmpty = outcome.value === 0
  // Rounded, because the exact count sits right beside it: the share is here to
  // be compared at a glance, and "58.7%" reads slower than "59%" for that.
  const share =
    outcome.value !== null && total > 0
      ? Math.round((outcome.value / total) * 100)
      : 0

  // Spans inside a button, where only phrasing content is allowed; blocks
  // elsewhere, where the loading placeholder needs one.
  const body = (Box: 'div' | 'span') => (
    // One line per outcome on a phone, a stacked figure once there is room
    // for four side by side — the same content at the density each width can
    // carry without turning the legend into four screens of scrolling.
    <Box className="flex items-center justify-between gap-3 sm:block">
      <Box
        className={cn(
          'flex items-center gap-2 text-sm',
          selected ? 'text-foreground font-semibold' : 'text-foreground/70'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 rounded-full',
            isEmpty ? 'bg-input' : outcome.dot
          )}
        />
        {outcome.label}
      </Box>
      <Box className="flex flex-wrap items-baseline gap-x-2 sm:mt-1.5">
        {isPending ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <span
            className={cn(
              'text-2xl font-bold tabular-nums',
              isEmpty ? 'text-muted-foreground/70' : 'text-foreground'
            )}
          >
            {outcome.value === null
              ? '—'
              : formatDashboardNumber(outcome.value, locale)}
          </span>
        )}
        {outcome.value !== null && !isEmpty && total > 0 && (
          <span className="text-caption text-muted-foreground tabular-nums">
            {t('standalone.outcomes.shareOfTotal', {
              percent: formatDashboardPercent(share, locale),
            })}
          </span>
        )}
      </Box>
    </Box>
  )

  // Selection is marked by more than a tint: a bar in the outcome's own colour
  // along the top edge, which still reads once the pointer has moved away.
  const selectedClassName = cn(
    'bg-muted/70 before:absolute before:inset-x-0 before:top-0 before:h-1',
    outcome.bar
  )

  if (onSelect) {
    if (isPending || (isEmpty && !selected)) {
      return (
        <div
          className={cn(
            'bg-card relative min-w-0 flex-1',
            figurePadding,
            selected && selectedClassName
          )}
        >
          {body('div')}
        </div>
      )
    }

    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          'bg-card relative min-w-0 flex-1 cursor-pointer text-start',
          figurePadding,
          figureInteraction,
          selected && selectedClassName
        )}
      >
        {body('span')}
      </button>
    )
  }

  if (isEmpty || outcome.value === null) {
    return (
      <div className={cn('bg-card min-w-0 flex-1', figurePadding)}>
        {body('div')}
      </div>
    )
  }

  return (
    <Link
      href={`${withLocale('/verifications', locale)}?status=${outcome.filter}`}
      className={cn('bg-card min-w-0 flex-1', figurePadding, figureInteraction)}
    >
      {body('span')}
    </Link>
  )
}
