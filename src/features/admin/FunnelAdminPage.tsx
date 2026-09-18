'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Activity,
  BarChart3,
  CircleAlert,
  Info,
  Loader2,
  Store,
  UserCheck,
} from 'lucide-react'
import { Badge, Button, Input, Skeleton } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { AdminFunnelResponse, FunnelStage } from './admin.model'
import { AdminApiError, getAdminFunnel } from './adminApi'
import { AdminErrorPanel } from './AdminErrorPanel'
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminSelect,
} from './AdminUi'

const stageLabels: Record<string, string> = {
  installation_completed: 'Installation completed',
  onboarding_completed: 'Onboarding completed',
  plan_selected: 'Plan selected',
  test_requested: 'Test requested',
  test_delivered: 'Test delivered',
  eligible_real_cod_detected: 'Eligible real COD detected',
  first_confirmation_delivered: 'First confirmation delivered',
  first_customer_response: 'First customer response',
  first_real_cod_resolved: 'First real COD resolved',
  paid_subscription_activated: 'Paid subscription activated',
}

const planOptions = [
  { value: '', label: 'All plans' },
  { value: 'starter', label: 'Starter' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'business', label: 'Business' },
]

interface FunnelFilters {
  installed_from: string
  installed_to: string
  plan: string
  country: string
}

function filtersFromParams(params: URLSearchParams): FunnelFilters {
  return {
    installed_from: params.get('installed_from') ?? '',
    installed_to: params.get('installed_to') ?? '',
    plan: params.get('plan') ?? '',
    country: params.get('country') ?? '',
  }
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return 'Unavailable'
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hr`
  return `${(seconds / 86400).toFixed(1)} days`
}

function formatInputDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function rangeForDays(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  return { from: formatInputDate(start), to: formatInputDate(end) }
}

function CaptureBadge({ capture }: { capture: FunnelStage['capture'] }) {
  const classes = {
    exact: 'border-primary-border bg-primary-subtle text-primary',
    estimated:
      'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
    mixed: 'border-info-border bg-info-subtle text-info-subtle-foreground',
    unavailable: 'border-border bg-muted/50 text-foreground/70',
  }
  return (
    <Badge
      variant="outline"
      className={cn('whitespace-nowrap', classes[capture])}
    >
      {capture[0].toUpperCase() + capture.slice(1)} data
    </Badge>
  )
}

export function FunnelAdminPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const requestSequence = useRef(0)
  const [response, setResponse] = useState<AdminFunnelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [filters, setFilters] = useState(() =>
    filtersFromParams(new URLSearchParams(queryString))
  )

  const replaceParams = useCallback(
    (params: URLSearchParams) => {
      const next = params.toString()
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
    },
    [pathname, router]
  )

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current
    setLoading(true)
    setError(null)
    try {
      const nextResponse = await getAdminFunnel(queryString)
      if (sequence === requestSequence.current) setResponse(nextResponse)
    } catch (nextError) {
      if (sequence !== requestSequence.current) return
      setError(
        nextError instanceof AdminApiError
          ? nextError
          : new AdminApiError('Unexpected admin API error.', 500, null)
      )
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setFilters(filtersFromParams(new URLSearchParams(queryString)))
  }, [queryString])

  const applyFilters = () => {
    const params = new URLSearchParams(queryString)
    for (const [key, value] of Object.entries(filters)) {
      if (value.trim()) params.set(key, value.trim())
      else params.delete(key)
    }
    replaceParams(params)
  }

  const clearFilters = () => {
    setFilters({ installed_from: '', installed_to: '', plan: '', country: '' })
    replaceParams(new URLSearchParams())
  }

  const applyPreset = (days: number | null) => {
    const params = new URLSearchParams(queryString)
    if (days === null) {
      params.delete('installed_from')
      params.delete('installed_to')
    } else {
      const range = rangeForDays(days)
      params.set('installed_from', range.from)
      params.set('installed_to', range.to)
    }
    replaceParams(params)
  }

  const presetIsActive = (days: number | null) => {
    const from = searchParams.get('installed_from') ?? ''
    const to = searchParams.get('installed_to') ?? ''
    if (days === null) return !from && !to
    const range = rangeForDays(days)
    return from === range.from && to === range.to
  }

  const hasFilters = ['installed_from', 'installed_to', 'plan', 'country'].some(
    (key) => searchParams.has(key)
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Activation journey"
        title="Activation funnel"
        description="Follow store conversion, elapsed time, and data confidence from installation through paid activation."
        evaluatedAt={response?.evaluated_at}
      />

      <section
        className="border-border bg-card rounded-2xl border p-4 shadow-xs"
        aria-label="Funnel filters"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="shrink-0">
            <p className="text-foreground/70 mb-1.5 text-xs font-medium">
              Installation period
            </p>
            <div className="border-border bg-muted/50 inline-flex rounded-lg border p-1">
              {[
                { label: '7D', days: 7 },
                { label: '30D', days: 30 },
                { label: '90D', days: 90 },
                { label: 'All', days: null },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={cn(
                    'focus-visible:ring-ring h-8 rounded-md px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    presetIsActive(preset.days)
                      ? 'bg-card text-primary-subtle-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => applyPreset(preset.days)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DateFilter
              label="Installed from"
              value={filters.installed_from}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  installed_from: value,
                }))
              }
            />
            <DateFilter
              label="Installed to"
              value={filters.installed_to}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  installed_to: value,
                }))
              }
            />
            <AdminSelect
              label="Plan"
              value={filters.plan}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  plan: event.target.value,
                }))
              }
              options={planOptions}
            />
            <label className="text-foreground/70 block text-xs font-medium">
              Country
              <Input
                className="focus:bg-card mt-1.5 h-10 rounded-lg border text-sm uppercase"
                placeholder="e.g. EG"
                maxLength={2}
                value={filters.country}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    country: event.target.value.toUpperCase(),
                  }))
                }
              />
            </label>
          </div>
          <div className="flex shrink-0 gap-2">
            {hasFilters && (
              <Button variant="ghost" className="h-10" onClick={clearFilters}>
                Clear
              </Button>
            )}
            <Button className="h-10" onClick={applyFilters}>
              Apply filters
            </Button>
          </div>
        </div>
      </section>

      {loading && !response ? (
        <FunnelSkeleton />
      ) : error && !response ? (
        <AdminErrorPanel
          message={error.message}
          requestId={error.requestId}
          onRetry={() => void load()}
        />
      ) : response ? (
        <>
          <div className="flex justify-end">
            {loading && (
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Loader2 className="size-3.5 animate-spin" /> Updating funnel
              </span>
            )}
          </div>

          {error && (
            <AdminErrorPanel
              compact
              message={error.message}
              requestId={error.requestId}
              onRetry={() => void load()}
            />
          )}

          <section
            className="grid gap-3 md:grid-cols-3"
            aria-label="Funnel summary"
          >
            <AdminMetricCard
              icon={Store}
              label="Installed-store cohort"
              value={response.cohort.installed_count.toLocaleString('en')}
              detail="Installation completed"
              tone="blue"
            />
            <AdminMetricCard
              icon={UserCheck}
              label="Active within seven days"
              value={`${response.active_after_7_days.rate}%`}
              detail={`${response.active_after_7_days.reached.toLocaleString('en')} of ${response.active_after_7_days.eligible_installations.toLocaleString('en')} eligible stores`}
              tone="emerald"
            />
            <AdminMetricCard
              icon={CircleAlert}
              label="Uninstall rate"
              value={`${response.uninstall.rate}%`}
              detail={`${response.uninstall.count.toLocaleString('en')} stores · average ${formatDuration(response.uninstall.average_time_from_install_seconds)}`}
              tone="amber"
            />
          </section>

          {response.cohort.installed_count === 0 ? (
            <AdminEmptyState
              icon={BarChart3}
              title="No installations in this cohort"
              description="Adjust the installation range, plan, or country to include more stores."
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <FunnelStages response={response} />
          )}

          <DataQualitySummary response={response} />
        </>
      ) : null}
    </div>
  )
}

function FunnelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[620px] rounded-2xl" />
    </div>
  )
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="text-foreground/70 block text-xs font-medium">
      {label}
      <Input
        className="focus:bg-card mt-1.5 h-10 rounded-lg border text-sm"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function FunnelStages({ response }: { response: AdminFunnelResponse }) {
  const dropOffs = response.stages.map((stage, index) => {
    const previousReached =
      index === 0
        ? response.cohort.installed_count
        : response.stages[index - 1].reached
    const count = Math.max(previousReached - stage.reached, 0)
    const rate = previousReached > 0 ? (count / previousReached) * 100 : 0
    return { count, rate }
  })
  const largestDropIndex = dropOffs.reduce(
    (largest, dropOff, index) =>
      index > 0 && dropOff.rate > dropOffs[largest].rate ? index : largest,
    0
  )

  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs">
      <div className="border-border flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-end sm:justify-between lg:px-6">
        <div>
          <h2 className="text-foreground font-semibold">Stage conversion</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Overall conversion is measured from the installation cohort.
          </p>
        </div>
        <p className="text-muted-foreground text-xs">
          {response.cohort.installed_count.toLocaleString('en')} stores at entry
        </p>
      </div>
      <ol className="divide-border divide-y">
        {response.stages.map((stage, index) => {
          const dropOff = dropOffs[index]
          const isLargestDrop =
            index === largestDropIndex && index > 0 && dropOff.rate > 0
          return (
            <li
              key={stage.stage}
              className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(220px,0.9fr)_minmax(300px,1.5fr)_minmax(300px,1fr)] lg:items-center lg:px-6"
            >
              <div className="flex items-start gap-3">
                <span className="border-border bg-muted/50 text-foreground/70 grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-foreground font-semibold">
                    {stageLabels[stage.stage] ?? stage.stage}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CaptureBadge capture={stage.capture} />
                    {isLargestDrop && (
                      <Badge
                        variant="outline"
                        className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground"
                      >
                        Largest drop-off
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">
                    {stage.reached.toLocaleString('en')} reached
                  </span>
                  <span className="text-foreground font-semibold tabular-nums">
                    {stage.overall_rate}% overall
                  </span>
                </div>
                <div className="bg-muted mt-2 h-2.5 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{
                      width: `${Math.min(Math.max(stage.overall_rate, 0), 100)}%`,
                    }}
                  />
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  {index === 0
                    ? 'Cohort baseline'
                    : `${dropOff.count.toLocaleString('en')} dropped · ${dropOff.rate.toFixed(1)}% from previous stage`}
                </p>
              </div>

              <dl className="bg-muted/50 grid grid-cols-3 gap-3 rounded-xl p-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Step rate</dt>
                  <dd className="text-foreground mt-1 font-semibold tabular-nums">
                    {stage.step_rate}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Average time</dt>
                  <dd className="text-foreground mt-1 font-semibold">
                    {formatDuration(stage.average_time_from_previous_seconds)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Time sample</dt>
                  <dd className="text-foreground mt-1 font-semibold tabular-nums">
                    {stage.time_sample_size.toLocaleString('en')}
                  </dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function DataQualitySummary({ response }: { response: AdminFunnelResponse }) {
  const quality = response.data_quality
  const items = [
    { label: 'Exact', value: quality.exact, color: 'bg-primary' },
    { label: 'Estimated', value: quality.estimated, color: 'bg-secondary' },
    { label: 'Unavailable', value: quality.unavailable, color: 'bg-input' },
  ]

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-xs lg:p-6">
      <div className="flex items-start gap-3">
        <span className="bg-info-subtle text-info-subtle-foreground grid size-9 shrink-0 place-items-center rounded-lg">
          <Info className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground font-semibold">Data confidence</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Coverage across every milestone in the selected cohort.
          </p>
          <div
            className="bg-muted mt-4 flex h-2.5 overflow-hidden rounded-full"
            aria-label={`Data quality: ${quality.exact}% exact, ${quality.estimated}% estimated, ${quality.unavailable}% unavailable`}
          >
            {items.map((item) => (
              <span
                key={item.label}
                className={item.color}
                style={{ width: `${item.value}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {items.map((item) => (
              <span
                key={item.label}
                className="text-foreground/70 inline-flex items-center gap-2 text-xs"
              >
                <span className={cn('size-2 rounded-full', item.color)} />
                {item.label}{' '}
                <strong className="text-foreground font-semibold tabular-nums">
                  {item.value}%
                </strong>
              </span>
            ))}
          </div>
          {quality.notes.length > 0 && (
            <ul className="border-border text-foreground/70 mt-4 space-y-1.5 border-t pt-4 text-xs">
              {quality.notes.map((note) => (
                <li key={note} className="flex items-start gap-2">
                  <Activity className="text-warning mt-0.5 size-3.5 shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
