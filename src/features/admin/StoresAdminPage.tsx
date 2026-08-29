'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Filter,
  HeartPulse,
  Loader2,
  Search,
  Store as StoreIcon,
  X,
} from 'lucide-react'
import { Badge, Button, Input, Skeleton } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type {
  AdminHealthStatus,
  AdminStore,
  AdminStoresResponse,
} from './admin.model'
import { AdminApiError, getAdminStores } from './adminApi'
import { AdminErrorPanel } from './AdminErrorPanel'
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminSelect,
} from './AdminUi'

const lifecycleOptions = [
  { value: '', label: 'All lifecycle stages' },
  { value: 'installed', label: 'Installed' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'uninstalled', label: 'Uninstalled' },
]

const healthOptions = [
  { value: '', label: 'All health states' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'attention_required', label: 'Attention required' },
  { value: 'critical', label: 'Critical' },
]

const planOptions = [
  { value: '', label: 'All plans' },
  { value: 'starter', label: 'Starter' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'business', label: 'Business' },
]

const sortOptions = [
  { value: 'installed_at', label: 'Installed date' },
  { value: 'store_name', label: 'Store name' },
  { value: 'last_activity', label: 'Last activity' },
  { value: 'usage_percent', label: 'Usage' },
  { value: 'activation_date', label: 'Activation date' },
  { value: 'health', label: 'Health' },
]

const filterLabels: Record<string, string> = {
  search: 'Search',
  lifecycle_status: 'Lifecycle',
  health_status: 'Health',
  plan: 'Plan',
  onboarding_status: 'Onboarding',
  country: 'Country',
  installed_from: 'Installed from',
  installed_to: 'Installed to',
  last_activity_from: 'Active from',
  last_activity_to: 'Active to',
}

const filterKeys = Object.keys(filterLabels)
const advancedKeys = [
  'onboarding_status',
  'country',
  'installed_from',
  'installed_to',
  'last_activity_from',
  'last_activity_to',
] as const

type AdvancedKey = (typeof advancedKeys)[number]
type AdvancedFilters = Record<AdvancedKey, string>

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
        new Date(value)
      )
    : 'Unknown'

const formatDateTime = (value: string | null) =>
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

function advancedFromParams(params: URLSearchParams): AdvancedFilters {
  return {
    onboarding_status: params.get('onboarding_status') ?? '',
    country: params.get('country') ?? '',
    installed_from: params.get('installed_from') ?? '',
    installed_to: params.get('installed_to') ?? '',
    last_activity_from: params.get('last_activity_from') ?? '',
    last_activity_to: params.get('last_activity_to') ?? '',
  }
}

function HealthBadge({ status }: { status: AdminHealthStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 whitespace-nowrap',
        status === 'healthy' &&
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        status === 'attention_required' &&
          'border-amber-200 bg-amber-50 text-amber-800',
        status === 'critical' && 'border-red-200 bg-red-50 text-red-700'
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'healthy' && 'bg-emerald-500',
          status === 'attention_required' && 'bg-amber-500',
          status === 'critical' && 'bg-red-500'
        )}
        aria-hidden="true"
      />
      {titleCase(status)}
    </Badge>
  )
}

function LifecycleBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-slate-200 bg-slate-50 whitespace-nowrap text-slate-700',
        status === 'active' &&
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        status === 'onboarding' && 'border-blue-200 bg-blue-50 text-blue-700',
        status === 'inactive' && 'border-amber-200 bg-amber-50 text-amber-800',
        status === 'uninstalled' &&
          'border-slate-200 bg-slate-100 text-slate-600'
      )}
    >
      {titleCase(status)}
    </Badge>
  )
}

function StoresSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-[440px] rounded-2xl" />
    </div>
  )
}

export function StoresAdminPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const requestSequence = useRef(0)
  const activeQuery = useRef(queryString)
  activeQuery.current = queryString
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [response, setResponse] = useState<AdminStoresResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [paginationError, setPaginationError] = useState<AdminApiError | null>(
    null
  )
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advanced, setAdvanced] = useState(() =>
    advancedFromParams(new URLSearchParams(queryString))
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
    setPaginationError(null)
    try {
      const nextResponse = await getAdminStores(queryString)
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
    const params = new URLSearchParams(queryString)
    setSearch(params.get('search') ?? '')
    setAdvanced(advancedFromParams(params))
  }, [queryString])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(queryString)
      if (search.trim()) params.set('search', search.trim())
      else params.delete('search')
      params.delete('cursor')
      if (params.toString() !== queryString) replaceParams(params)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [queryString, replaceParams, search])

  const setFilter = (name: string, value: string) => {
    const params = new URLSearchParams(queryString)
    if (value) params.set(name, value)
    else params.delete(name)
    params.delete('cursor')
    replaceParams(params)
  }

  const toggleFilter = (name: string, value: string) => {
    setFilter(name, searchParams.get(name) === value ? '' : value)
  }

  const applyAdvanced = () => {
    const params = new URLSearchParams(queryString)
    advancedKeys.forEach((key) => {
      const value = advanced[key].trim()
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.delete('cursor')
    replaceParams(params)
    setAdvancedOpen(false)
  }

  const cancelAdvanced = () => {
    setAdvanced(advancedFromParams(new URLSearchParams(queryString)))
    setAdvancedOpen(false)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(queryString)
    filterKeys.forEach((key) => params.delete(key))
    params.delete('cursor')
    setSearch('')
    setAdvanced(advancedFromParams(new URLSearchParams()))
    replaceParams(params)
  }

  const removeFilter = (name: string) => {
    const params = new URLSearchParams(queryString)
    params.delete(name)
    params.delete('cursor')
    if (name === 'search') setSearch('')
    replaceParams(params)
  }

  const loadMore = async () => {
    if (!response?.next_cursor) return
    const requestedQuery = queryString
    setLoadingMore(true)
    setPaginationError(null)
    try {
      const params = new URLSearchParams(queryString)
      params.set('cursor', response.next_cursor)
      const next = await getAdminStores(params.toString())
      if (activeQuery.current !== requestedQuery) return
      setResponse({
        ...next,
        summary: response.summary,
        data: [...response.data, ...next.data],
      })
    } catch (nextError) {
      setPaginationError(
        nextError instanceof AdminApiError
          ? nextError
          : new AdminApiError('Unable to load more stores.', 500, null)
      )
    } finally {
      setLoadingMore(false)
    }
  }

  const activeFilters = filterKeys.flatMap((key) => {
    const value = searchParams.get(key)
    return value ? [{ key, label: filterLabels[key], value }] : []
  })
  const advancedCount = advancedKeys.filter((key) =>
    searchParams.has(key)
  ).length
  const sort = searchParams.get('sort') ?? 'installed_at'
  const direction = searchParams.get('direction') ?? 'desc'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Store operations"
        title="Stores overview"
        description="Monitor installation, activation, usage, and operational health from one workspace."
        evaluatedAt={response?.evaluated_at}
      />

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
          <section aria-labelledby="store-metrics-heading">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2
                  id="store-metrics-heading"
                  className="text-sm font-semibold text-slate-900"
                >
                  Operational summary
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select a status card to filter the store list.
                </p>
              </div>
              {loading && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Loader2 className="size-3.5 animate-spin" /> Updating
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
              <AdminMetricCard
                label="Currently installed"
                value={response.summary.currently_installed ?? 0}
                detail="All installed stores"
                icon={StoreIcon}
                tone="blue"
              />
              <AdminMetricCard
                label="Onboarding"
                value={response.summary.onboarding ?? 0}
                icon={Activity}
                tone="blue"
                active={searchParams.get('lifecycle_status') === 'onboarding'}
                onClick={() => toggleFilter('lifecycle_status', 'onboarding')}
              />
              <AdminMetricCard
                label="Activated"
                value={response.summary.activated ?? 0}
                icon={CheckCircle2}
                tone="emerald"
                active={searchParams.get('lifecycle_status') === 'active'}
                onClick={() => toggleFilter('lifecycle_status', 'active')}
              />
              <AdminMetricCard
                label="Inactive"
                value={response.summary.inactive ?? 0}
                icon={CircleAlert}
                tone="amber"
                active={searchParams.get('lifecycle_status') === 'inactive'}
                onClick={() => toggleFilter('lifecycle_status', 'inactive')}
              />
              <AdminMetricCard
                label="Uninstalled"
                value={response.summary.uninstalled ?? 0}
                icon={StoreIcon}
                active={searchParams.get('lifecycle_status') === 'uninstalled'}
                onClick={() => toggleFilter('lifecycle_status', 'uninstalled')}
              />
              <AdminMetricCard
                label="Healthy"
                value={response.summary.healthy ?? 0}
                icon={HeartPulse}
                tone="emerald"
                active={searchParams.get('health_status') === 'healthy'}
                onClick={() => toggleFilter('health_status', 'healthy')}
              />
              <AdminMetricCard
                label="Needs attention"
                value={response.summary.attention_required ?? 0}
                icon={CircleAlert}
                tone="amber"
                active={
                  searchParams.get('health_status') === 'attention_required'
                }
                onClick={() =>
                  toggleFilter('health_status', 'attention_required')
                }
              />
              <AdminMetricCard
                label="Critical"
                value={response.summary.critical ?? 0}
                icon={CircleAlert}
                tone="red"
                active={searchParams.get('health_status') === 'critical'}
                onClick={() => toggleFilter('health_status', 'critical')}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.7fr)_repeat(3,minmax(150px,1fr))_minmax(160px,1fr)_auto_auto]">
              <label className="relative block">
                <span className="sr-only">Search stores</span>
                <Search className="absolute top-3 left-3 size-4 text-slate-400" />
                <Input
                  className="h-10 rounded-lg border pl-9 text-sm focus:bg-white"
                  placeholder="Search store, domain, or organization"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <AdminSelect
                label="Lifecycle"
                hideLabel
                value={searchParams.get('lifecycle_status') ?? ''}
                onChange={(event) =>
                  setFilter('lifecycle_status', event.target.value)
                }
                options={lifecycleOptions}
              />
              <AdminSelect
                label="Health"
                hideLabel
                value={searchParams.get('health_status') ?? ''}
                onChange={(event) =>
                  setFilter('health_status', event.target.value)
                }
                options={healthOptions}
              />
              <AdminSelect
                label="Plan"
                hideLabel
                value={searchParams.get('plan') ?? ''}
                onChange={(event) => setFilter('plan', event.target.value)}
                options={planOptions}
              />
              <AdminSelect
                label="Sort stores"
                hideLabel
                value={sort}
                onChange={(event) => setFilter('sort', event.target.value)}
                options={sortOptions}
              />
              <Button
                variant="outline"
                className="h-10 px-3"
                onClick={() =>
                  setFilter('direction', direction === 'asc' ? 'desc' : 'asc')
                }
                aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`}
              >
                {direction === 'asc' ? <ArrowUp /> : <ArrowDown />}
                <span className="xl:sr-only">
                  {direction === 'asc' ? 'Ascending' : 'Descending'}
                </span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  'h-10 px-3',
                  (advancedOpen || advancedCount > 0) &&
                    'border-emerald-200 bg-emerald-50 text-emerald-800'
                )}
                onClick={() => setAdvancedOpen((value) => !value)}
                aria-expanded={advancedOpen}
                aria-controls="advanced-store-filters"
              >
                <Filter />
                Advanced
                {advancedCount > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-700 text-[11px] text-white">
                    {advancedCount}
                  </span>
                )}
              </Button>
            </div>

            {advancedOpen && (
              <div
                id="advanced-store-filters"
                className="border-t border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <AdminSelect
                    label="Onboarding"
                    value={advanced.onboarding_status}
                    onChange={(event) =>
                      setAdvanced((current) => ({
                        ...current,
                        onboarding_status: event.target.value,
                      }))
                    }
                    options={[
                      { value: '', label: 'All onboarding states' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'completed', label: 'Completed' },
                    ]}
                  />
                  <label className="block text-xs font-medium text-slate-600">
                    Country
                    <Input
                      className="mt-1.5 h-10 rounded-lg border text-sm uppercase focus:bg-white"
                      placeholder="e.g. EG"
                      maxLength={2}
                      value={advanced.country}
                      onChange={(event) =>
                        setAdvanced((current) => ({
                          ...current,
                          country: event.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </label>
                  <AdvancedDate
                    label="Installed from"
                    value={advanced.installed_from}
                    onChange={(value) =>
                      setAdvanced((current) => ({
                        ...current,
                        installed_from: value,
                      }))
                    }
                  />
                  <AdvancedDate
                    label="Installed to"
                    value={advanced.installed_to}
                    onChange={(value) =>
                      setAdvanced((current) => ({
                        ...current,
                        installed_to: value,
                      }))
                    }
                  />
                  <AdvancedDate
                    label="Last activity from"
                    value={advanced.last_activity_from}
                    onChange={(value) =>
                      setAdvanced((current) => ({
                        ...current,
                        last_activity_from: value,
                      }))
                    }
                  />
                  <AdvancedDate
                    label="Last activity to"
                    value={advanced.last_activity_to}
                    onChange={(value) =>
                      setAdvanced((current) => ({
                        ...current,
                        last_activity_to: value,
                      }))
                    }
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={cancelAdvanced}>
                    Cancel
                  </Button>
                  <Button onClick={applyAdvanced}>Apply filters</Button>
                </div>
              </div>
            )}

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
                <span className="text-xs font-medium text-slate-500">
                  Active filters
                </span>
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className="inline-flex h-7 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    onClick={() => removeFilter(filter.key)}
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    <span className="font-medium">{filter.label}:</span>
                    {titleCase(filter.value)}
                    <X className="size-3" aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  className="ml-auto text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>
            )}
          </section>

          {error && response && (
            <AdminErrorPanel
              compact
              message={error.message}
              requestId={error.requestId}
              onRetry={() => void load()}
            />
          )}

          {response.data.length === 0 ? (
            <AdminEmptyState
              icon={StoreIcon}
              title={
                activeFilters.length > 0
                  ? 'No stores match these filters'
                  : 'No stores yet'
              }
              description={
                activeFilters.length > 0
                  ? 'Adjust or clear the filters to broaden the results.'
                  : 'Installed Shopify stores will appear here.'
              }
              action={
                activeFilters.length > 0 ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <StoresResults
              stores={response.data}
              sort={sort}
              direction={direction}
              onSort={(nextSort) => {
                if (sort === nextSort)
                  setFilter('direction', direction === 'asc' ? 'desc' : 'asc')
                else {
                  const params = new URLSearchParams(queryString)
                  params.set('sort', nextSort)
                  params.set('direction', 'desc')
                  params.delete('cursor')
                  replaceParams(params)
                }
              }}
            />
          )}

          <div className="flex flex-col items-center gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
            <p className="text-xs text-slate-500">
              {response.data.length.toLocaleString('en')} stores loaded
              {response.next_cursor ? ' · More available' : ' · End of results'}
            </p>
            {response.next_cursor && (
              <Button
                variant="outline"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore && <Loader2 className="animate-spin" />}
                {loadingMore ? 'Loading stores…' : 'Load more stores'}
              </Button>
            )}
          </div>
          {paginationError && (
            <AdminErrorPanel
              compact
              message={paginationError.message}
              requestId={paginationError.requestId}
              onRetry={() => void loadMore()}
            />
          )}
        </>
      ) : null}
    </div>
  )
}

function AdvancedDate({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <Input
        className="mt-1.5 h-10 rounded-lg border text-sm focus:bg-white"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

interface StoresResultsProps {
  stores: AdminStore[]
  sort: string
  direction: string
  onSort: (sort: string) => void
}

function StoresResults({
  stores,
  sort,
  direction,
  onSort,
}: StoresResultsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section aria-label="Store results">
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <SortableHeader
                  label="Store"
                  sortKey="store_name"
                  activeSort={sort}
                  direction={direction}
                  onSort={onSort}
                />
                <th className="px-4 py-3">Lifecycle</th>
                <SortableHeader
                  label="Installed"
                  sortKey="installed_at"
                  activeSort={sort}
                  direction={direction}
                  onSort={onSort}
                />
                <th className="px-4 py-3">Plan</th>
                <SortableHeader
                  label="Usage"
                  sortKey="usage_percent"
                  activeSort={sort}
                  direction={direction}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Last activity"
                  sortKey="last_activity"
                  activeSort={sort}
                  direction={direction}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Health"
                  sortKey="health"
                  activeSort={sort}
                  direction={direction}
                  onSort={onSort}
                />
                <th className="w-14 px-3 py-3">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map((store) => {
                const isExpanded = expanded.has(store.integration_id)
                const detailId = `store-details-${store.integration_id}`
                return (
                  <Fragment key={store.integration_id}>
                    <tr
                      className={cn(
                        'align-middle transition-colors hover:bg-slate-50/80',
                        isExpanded && 'bg-slate-50/70'
                      )}
                    >
                      <td className="max-w-64 px-4 py-4">
                        <p className="truncate font-semibold text-slate-900">
                          {store.store_name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {store.shop_domain}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <LifecycleBadge status={store.lifecycle_status} />
                      </td>
                      <td className="px-4 py-4 text-xs whitespace-nowrap text-slate-600">
                        {formatDate(store.installed_at)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">
                          {titleCase(store.plan)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {titleCase(store.subscription_status)}
                        </p>
                      </td>
                      <td className="min-w-40 px-4 py-4">
                        <UsageMeter store={store} />
                      </td>
                      <td className="px-4 py-4 text-xs whitespace-nowrap text-slate-600">
                        {formatDateTime(store.last_activity_at)}
                      </td>
                      <td className="px-4 py-4">
                        <HealthBadge status={store.health.status} />
                        {store.health.top_signal && (
                          <p className="mt-1 max-w-36 truncate text-xs text-slate-500">
                            {titleCase(store.health.top_signal)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => toggle(store.integration_id)}
                          aria-expanded={isExpanded}
                          aria-controls={detailId}
                          aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${store.store_name}`}
                        >
                          <ChevronRight
                            className={cn(
                              'transition-transform',
                              isExpanded && 'rotate-90'
                            )}
                          />
                        </Button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr id={detailId}>
                        <td colSpan={8} className="bg-slate-50 px-5 py-5">
                          <StoreDetails store={store} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {stores.map((store) => {
          const isExpanded = expanded.has(store.integration_id)
          const detailId = `mobile-store-details-${store.integration_id}`
          return (
            <article
              key={store.integration_id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-950">
                    {store.store_name}
                  </h3>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {store.shop_domain}
                  </p>
                </div>
                <HealthBadge status={store.health.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Lifecycle</p>
                  <div className="mt-1.5">
                    <LifecycleBadge status={store.lifecycle_status} />
                  </div>
                </div>
                <div>
                  <p className="text-slate-500">Plan</p>
                  <p className="mt-1.5 font-medium text-slate-800">
                    {titleCase(store.plan)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="mb-1.5 text-slate-500">Usage</p>
                  <UsageMeter store={store} />
                </div>
                <div>
                  <p className="text-slate-500">Installed</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {formatDate(store.installed_at)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Last activity</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {formatDate(store.last_activity_at)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="mt-3 h-9 w-full justify-between border-t border-slate-100 px-1 pt-3"
                onClick={() => toggle(store.integration_id)}
                aria-expanded={isExpanded}
                aria-controls={detailId}
              >
                {isExpanded
                  ? 'Hide operational details'
                  : 'View operational details'}
                <ChevronDown
                  className={cn(
                    'transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </Button>
              {isExpanded && (
                <div
                  id={detailId}
                  className="mt-4 border-t border-slate-100 pt-4"
                >
                  <StoreDetails store={store} />
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  direction,
  onSort,
}: {
  label: string
  sortKey: string
  activeSort: string
  direction: string
  onSort: (sort: string) => void
}) {
  const active = activeSort === sortKey
  return (
    <th
      className="px-4 py-3"
      aria-sort={
        active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        onClick={() => onSort(sortKey)}
      >
        {label}
        {active ? (
          direction === 'asc' ? (
            <ArrowUp className="size-3.5 text-emerald-700" />
          ) : (
            <ArrowDown className="size-3.5 text-emerald-700" />
          )
        ) : (
          <ArrowDown className="size-3.5 opacity-30" />
        )}
      </button>
    </th>
  )
}

function UsageMeter({ store }: { store: AdminStore }) {
  const width = Math.min(Math.max(store.usage.percent, 0), 100)
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-800 tabular-nums">
          {store.usage.used.toLocaleString('en')} /{' '}
          {store.usage.limit
            ? store.usage.limit.toLocaleString('en')
            : 'Unknown'}
        </span>
        {store.usage.limit > 0 && (
          <span className="text-slate-500 tabular-nums">
            {store.usage.percent}%
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            'h-full rounded-full',
            store.usage.percent >= 100
              ? 'bg-red-500'
              : store.usage.percent >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function StoreDetails({ store }: { store: AdminStore }) {
  const details = [
    ['Country', store.country_code ?? 'Unknown'],
    ['Timezone', store.timezone ?? 'Unknown'],
    ['Onboarding', titleCase(store.onboarding_status)],
    ['Subscription', titleCase(store.subscription_status)],
    ['Automation', store.auto_confirmation_enabled ? 'Enabled' : 'Disabled'],
    ['Test message', titleCase(store.test_message_status)],
    ['First eligible COD', formatDateTime(store.first_eligible_real_order_at)],
    ['Activated', formatDateTime(store.activated_at)],
    [
      'Health signals',
      store.health.signal_count > 0
        ? `${store.health.signal_count} · ${titleCase(store.health.top_signal)}`
        : 'No active signals',
    ],
    [
      'Data quality',
      store.data_quality.length > 0
        ? store.data_quality.map(titleCase).join(', ')
        : 'No quality warnings',
    ],
  ]

  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-5">
      {details.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-slate-500">{label}</dt>
          <dd className="mt-1 text-sm font-medium break-words text-slate-800">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
