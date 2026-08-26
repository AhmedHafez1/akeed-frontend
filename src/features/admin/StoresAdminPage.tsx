'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, Store as StoreIcon } from 'lucide-react'
import { Badge, Button, Card, Input, Skeleton } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type {
  AdminHealthStatus,
  AdminStore,
  AdminStoresResponse,
} from './admin.model'
import { AdminApiError, getAdminStores } from './adminApi'
import { AdminErrorPanel } from './AdminErrorPanel'

const summaryCards = [
  ['currently_installed', 'Currently installed'],
  ['onboarding', 'Onboarding'],
  ['activated', 'Activated'],
  ['inactive', 'Inactive'],
  ['uninstalled', 'Recently uninstalled'],
  ['attention_required', 'Attention required'],
  ['critical', 'Critical'],
] as const

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Unknown'

const titleCase = (value: string | null) =>
  value
    ? value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Unknown'

function HealthBadge({ status }: { status: AdminHealthStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'healthy' &&
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        status === 'attention_required' &&
          'border-amber-200 bg-amber-50 text-amber-800',
        status === 'critical' && 'border-red-200 bg-red-50 text-red-700'
      )}
    >
      {titleCase(status)}
    </Badge>
  )
}

function StoresSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-[480px] rounded-2xl" />
    </div>
  )
}

export function StoresAdminPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [response, setResponse] = useState<AdminStoresResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)

  const queryString = searchParams.toString()
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setResponse(await getAdminStores(queryString))
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search.trim()) params.set('search', search.trim())
      else params.delete('search')
      params.delete('cursor')
      const next = params.toString()
      if (next !== searchParams.toString())
        router.replace(`${pathname}?${next}`)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [pathname, router, search, searchParams])

  const setFilter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(name, value)
    else params.delete(name)
    params.delete('cursor')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const loadMore = async () => {
    if (!response?.next_cursor) return
    setLoadingMore(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set('cursor', response.next_cursor)
      const next = await getAdminStores(params.toString())
      setResponse({
        ...next,
        summary: response.summary,
        data: [...response.data, ...next.data],
      })
    } catch (nextError) {
      setError(
        nextError instanceof AdminApiError
          ? nextError
          : new AdminApiError('Unable to load more stores.', 500, null)
      )
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-700">Store operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Stores overview
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Installation, activation, usage, and operational health in one view.
        </p>
      </div>

      {loading && !response ? (
        <StoresSkeleton />
      ) : error && !response ? (
        <AdminErrorPanel
          message={error.message}
          requestId={error.requestId}
          onRetry={() => void load()}
        />
      ) : response ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {summaryCards.map(([key, label]) => (
              <Card
                key={key}
                className="rounded-2xl border-slate-200 p-5 shadow-sm"
              >
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold tabular-nums">
                  {response.summary[key] ?? 0}
                </p>
              </Card>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-8">
              <label className="relative md:col-span-2">
                <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                <Input
                  aria-label="Search stores"
                  className="pl-9"
                  placeholder="Search store, domain, or organization"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <FilterSelect
                label="Plan"
                value={searchParams.get('plan') ?? ''}
                onChange={(value) => setFilter('plan', value)}
                options={['starter', 'basic', 'pro', 'business']}
              />
              <FilterSelect
                label="Lifecycle"
                value={searchParams.get('lifecycle_status') ?? ''}
                onChange={(value) => setFilter('lifecycle_status', value)}
                options={[
                  'installed',
                  'onboarding',
                  'active',
                  'inactive',
                  'uninstalled',
                ]}
              />
              <FilterSelect
                label="Onboarding"
                value={searchParams.get('onboarding_status') ?? ''}
                onChange={(value) => setFilter('onboarding_status', value)}
                options={['pending', 'completed']}
              />
              <FilterSelect
                label="Health"
                value={searchParams.get('health_status') ?? ''}
                onChange={(value) => setFilter('health_status', value)}
                options={['healthy', 'attention_required', 'critical']}
              />
              <Input
                aria-label="Country"
                placeholder="Country code"
                maxLength={2}
                value={searchParams.get('country') ?? ''}
                onChange={(event) =>
                  setFilter('country', event.target.value.toUpperCase())
                }
              />
              <FilterSelect
                label="Sort"
                value={searchParams.get('sort') ?? 'installed_at'}
                onChange={(value) => setFilter('sort', value)}
                options={[
                  'installed_at',
                  'store_name',
                  'last_activity',
                  'usage_percent',
                  'activation_date',
                  'health',
                ]}
                includeAll={false}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <DateFilter
                label="Last activity from"
                value={searchParams.get('last_activity_from') ?? ''}
                onChange={(value) => setFilter('last_activity_from', value)}
              />
              <DateFilter
                label="Last activity to"
                value={searchParams.get('last_activity_to') ?? ''}
                onChange={(value) => setFilter('last_activity_to', value)}
              />
            </div>
          </section>

          {response.data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <StoreIcon className="mx-auto size-9 text-slate-400" />
              <h2 className="mt-4 font-semibold">
                {searchParams.size
                  ? 'No stores match these filters'
                  : 'No stores yet'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {searchParams.size
                  ? 'Adjust or clear the filters to broaden the results.'
                  : 'Installed Shopify stores will appear here.'}
              </p>
            </div>
          ) : (
            <StoresTable stores={response.data} />
          )}

          {response.next_cursor && (
            <div className="text-center">
              <Button
                variant="outline"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
          {error && response && (
            <AdminErrorPanel
              message={error.message}
              requestId={error.requestId}
              onRetry={() => setError(null)}
            />
          )}
        </>
      ) : null}
    </div>
  )
}

interface FilterSelectProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  includeAll?: boolean
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  includeAll = true,
}: FilterSelectProps) {
  return (
    <select
      aria-label={label}
      className="border-input h-10 rounded-md border bg-white px-3 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {includeAll && <option value="">All {label.toLowerCase()}</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {titleCase(option)}
        </option>
      ))}
    </select>
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

function StoresTable({ stores }: { stores: AdminStore[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              {[
                'Store',
                'Country / timezone',
                'Installed',
                'Lifecycle',
                'Onboarding',
                'Plan / subscription',
                'Usage',
                'Automation',
                'Test message',
                'First eligible COD',
                'Activated',
                'Last activity',
                'Health',
              ].map((header) => (
                <th key={header} className="px-4 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stores.map((store) => (
              <tr
                key={store.integration_id}
                className="align-top hover:bg-slate-50/70"
              >
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-900">
                    {store.store_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {store.shop_domain}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p>{store.country_code ?? 'Unknown'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {store.timezone ?? 'Unknown'}
                  </p>
                </td>
                <td className="px-4 py-4 text-xs text-slate-600">
                  {formatDate(store.installed_at)}
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline">
                    {titleCase(store.lifecycle_status)}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  {titleCase(store.onboarding_status)}
                </td>
                <td className="px-4 py-4">
                  <p>{titleCase(store.plan)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {titleCase(store.subscription_status)}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium tabular-nums">
                    {store.usage.used} / {store.usage.limit || 'Unknown'}
                  </p>
                  <div className="mt-2 h-1.5 w-24 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${Math.min(store.usage.percent, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {store.usage.limit
                      ? `${store.usage.percent}% · ${store.usage.remaining} remaining`
                      : 'Unknown limit'}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {store.auto_confirmation_enabled ? 'Enabled' : 'Disabled'}
                </td>
                <td className="px-4 py-4">
                  {titleCase(store.test_message_status)}
                </td>
                <td className="px-4 py-4 text-xs text-slate-600">
                  {formatDate(store.first_eligible_real_order_at)}
                </td>
                <td className="px-4 py-4 text-xs text-slate-600">
                  {formatDate(store.activated_at)}
                </td>
                <td className="px-4 py-4 text-xs text-slate-600">
                  {formatDate(store.last_activity_at)}
                </td>
                <td className="px-4 py-4">
                  <HealthBadge status={store.health.status} />
                  {store.health.top_signal && (
                    <p className="mt-1 text-xs text-slate-500">
                      {titleCase(store.health.top_signal)}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
