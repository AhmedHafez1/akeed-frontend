'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Activity, BarChart3 } from 'lucide-react'
import { Badge, Card, Input, Skeleton } from '@/shared/ui'
import type { AdminFunnelResponse, FunnelStage } from './admin.model'
import { AdminApiError, getAdminFunnel } from './adminApi'
import { AdminErrorPanel } from './AdminErrorPanel'

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

function formatDuration(seconds: number | null) {
  if (seconds === null) return 'Unavailable'
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hr`
  return `${(seconds / 86400).toFixed(1)} days`
}

function CaptureBadge({ capture }: { capture: FunnelStage['capture'] }) {
  const classes = {
    exact: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    estimated: 'border-amber-200 bg-amber-50 text-amber-800',
    mixed: 'border-blue-200 bg-blue-50 text-blue-700',
    unavailable: 'border-slate-200 bg-slate-50 text-slate-600',
  }
  return (
    <Badge variant="outline" className={classes[capture]}>
      {capture[0].toUpperCase() + capture.slice(1)}
    </Badge>
  )
}

export function FunnelAdminPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [response, setResponse] = useState<AdminFunnelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AdminApiError | null>(null)
  const queryString = searchParams.toString()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setResponse(await getAdminFunnel(queryString))
    } catch (nextError) {
      setError(
        nextError instanceof AdminApiError
          ? nextError
          : new AdminApiError('Unexpected admin API error.', 500, null)
      )
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    void load()
  }, [load])

  const setFilter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(name, value)
    else params.delete(name)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-700">
          Activation journey
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Activation funnel
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Conversion and elapsed time for stores grouped by installation date.
        </p>
      </div>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <DateFilter
          label="Installed from"
          value={searchParams.get('installed_from') ?? ''}
          onChange={(value) => setFilter('installed_from', value)}
        />
        <DateFilter
          label="Installed to"
          value={searchParams.get('installed_to') ?? ''}
          onChange={(value) => setFilter('installed_to', value)}
        />
        <select
          aria-label="Plan"
          className="border-input h-10 self-end rounded-md border bg-white px-3 text-sm"
          value={searchParams.get('plan') ?? ''}
          onChange={(event) => setFilter('plan', event.target.value)}
        >
          <option value="">All plans</option>
          {['starter', 'basic', 'pro', 'business'].map((plan) => (
            <option key={plan} value={plan}>
              {plan[0].toUpperCase() + plan.slice(1)}
            </option>
          ))}
        </select>
        <Input
          aria-label="Country"
          className="self-end"
          placeholder="Country code"
          maxLength={2}
          value={searchParams.get('country') ?? ''}
          onChange={(event) =>
            setFilter('country', event.target.value.toUpperCase())
          }
        />
      </section>

      {loading && !response ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-[620px] rounded-2xl" />
        </div>
      ) : error && !response ? (
        <AdminErrorPanel
          message={error.message}
          requestId={error.requestId}
          onRetry={() => void load()}
        />
      ) : response ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <MetricCard
              icon={BarChart3}
              label="Installed-store cohort"
              value={response.cohort.installed_count.toLocaleString('en')}
              detail="Installation completed"
            />
            <MetricCard
              icon={Activity}
              label="Active after seven days"
              value={`${response.active_after_7_days.rate}%`}
              detail={`${response.active_after_7_days.reached} of ${response.active_after_7_days.eligible_installations} eligible installations`}
            />
            <MetricCard
              icon={Activity}
              label="Uninstall rate"
              value={`${response.uninstall.rate}%`}
              detail={`${response.uninstall.count} stores · avg ${formatDuration(response.uninstall.average_time_from_install_seconds)}`}
            />
          </section>

          {response.cohort.installed_count === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <BarChart3 className="mx-auto size-9 text-slate-400" />
              <h2 className="mt-4 font-semibold">
                No installations in this cohort
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Adjust the installation range, plan, or country.
              </p>
            </div>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-7">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Stage conversion</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Bars show overall conversion from installation.
                  </p>
                </div>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span>Exact {response.data_quality.exact}%</span>
                  <span>Estimated {response.data_quality.estimated}%</span>
                  <span>Unavailable {response.data_quality.unavailable}%</span>
                </div>
              </div>
              <div className="space-y-3">
                {response.stages.map((stage, index) => (
                  <div
                    key={stage.stage}
                    className="grid gap-3 rounded-xl border border-slate-100 p-4 lg:grid-cols-[250px_1fr_330px] lg:items-center"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Stage {index + 1}
                      </p>
                      <p className="font-semibold">
                        {stageLabels[stage.stage] ?? stage.stage}
                      </p>
                      <div className="mt-2">
                        <CaptureBadge capture={stage.capture} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {stage.reached.toLocaleString('en')} reached
                        </span>
                        <span className="font-semibold text-slate-900">
                          {stage.overall_rate}% overall
                        </span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${Math.min(stage.overall_rate, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <dl className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <dt className="text-slate-500">Step conversion</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {stage.step_rate}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Average time</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {formatDuration(
                            stage.average_time_from_previous_seconds
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Time sample</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {stage.time_sample_size}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
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
    <label className="text-xs font-medium text-slate-500">
      {label}
      <Input
        className="mt-1"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="rounded-2xl border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{detail}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="size-5" />
        </span>
      </div>
    </Card>
  )
}
