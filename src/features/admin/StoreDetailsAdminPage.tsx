'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Coins,
  ExternalLink,
  FlaskConical,
  Gauge,
  ListChecks,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Store as StoreIcon,
  Wallet,
} from 'lucide-react'
import { Badge, Button, Skeleton } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type {
  AdminStoreDetail,
  AdminStoreMilestone,
  AdminStoreVerification,
} from './admin.model'
import { AdminErrorPanel } from './AdminErrorPanel'
import {
  CreditBalanceBadge,
  formatDate,
  formatDateTime,
  HealthBadge,
  isInstalledPlatform,
  LifecycleBadge,
  PlatformBadge,
  platformLabel,
  titleCase,
  UsageMeter,
} from './AdminStoreUi'
import { AdminEmptyState, AdminMetricCard, AdminSelect } from './AdminUi'
import {
  useAdminStore,
  useAdminStoreVerifications,
  type AdminStoreVerificationFilters,
} from './useAdminStore'

const verificationStatusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'read', label: 'Read' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'no_reply', label: 'No reply' },
  { value: 'expired', label: 'Expired' },
  { value: 'failed', label: 'Failed' },
]

const milestoneLabels: Record<string, string> = {
  installation_completed: 'Installed',
  onboarding_completed: 'Onboarding completed',
  plan_selected: 'Plan selected',
  test_requested: 'Test message requested',
  test_delivered: 'Test message delivered',
  eligible_real_cod_detected: 'First eligible COD order',
  first_confirmation_delivered: 'First confirmation delivered',
  first_customer_response: 'First customer response',
  first_real_cod_resolved: 'Activated (first order resolved)',
  paid_subscription_activated: 'Paid subscription activated',
  uninstalled: 'Uninstalled',
}

const signalLabels: Record<string, string> = {
  store_uninstalled: 'Store uninstalled',
  onboarding_incomplete: 'Onboarding incomplete',
  no_eligible_order: 'No eligible COD order yet',
  usage_critical: 'Plan usage almost exhausted',
  usage_attention: 'Plan usage above 80%',
  failed_verification_rate: 'High failed verification rate (24h)',
  webhook_failures: 'Webhook delivery failures (1h)',
  auto_confirmation_disabled: 'Auto-confirmation is disabled',
  subscription_blocked: 'Subscription is blocked',
  credits_exhausted: 'No credits left',
  credits_low: 'Credit balance is low',
  no_recent_activity: 'No recent activity',
}

const numberFormat = new Intl.NumberFormat('en')

interface StoreDetailsAdminPageProps {
  integrationId: string
}

export function StoreDetailsAdminPage({
  integrationId,
}: StoreDetailsAdminPageProps) {
  const { locale } = useLocaleInfo()
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const backHref = `/${locale}/admin/stores${from ? `?${from}` : ''}`
  const { response, loading, error, refresh } = useAdminStore(integrationId)
  const [revision, setRevision] = useState(0)
  const store = response?.store ?? null

  const refreshAll = () => {
    refresh()
    setRevision((value) => value + 1)
  }

  return (
    <div className="space-y-6" aria-busy={loading}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-emerald-700 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        Back to stores
      </Link>

      {loading && !store ? (
        <StoreDetailsSkeleton />
      ) : error && !store ? (
        error.status === 404 ? (
          <AdminEmptyState
            icon={StoreIcon}
            title="Store not found"
            description="This store may have been removed, or the link is incorrect."
            action={
              <Button asChild variant="outline">
                <Link href={backHref}>Back to stores</Link>
              </Button>
            }
          />
        ) : (
          <AdminErrorPanel
            message={error.message}
            requestId={error.requestId}
            onRetry={refresh}
          />
        )
      ) : store && response ? (
        <>
          <StoreHeader
            store={store}
            evaluatedAt={response.evaluated_at}
            loading={loading}
            onRefresh={refreshAll}
          />
          {error && (
            <AdminErrorPanel
              compact
              message={error.message}
              requestId={error.requestId}
              onRetry={refresh}
            />
          )}
          <StoreKpis store={store} />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-4 lg:col-span-2 lg:grid-cols-2">
              <ProfileCard store={store} />
              <BillingCard store={store} />
              <AutomationCard store={store} />
              <HealthCard store={store} />
            </div>
            <LifecycleCard milestones={store.milestones} />
          </div>
          <VerificationsSection
            integrationId={integrationId}
            store={store}
            revision={revision}
          />
        </>
      ) : null}
    </div>
  )
}

function StoreDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}

function StoreHeader({
  store,
  evaluatedAt,
  loading,
  onRefresh,
}: {
  store: AdminStoreDetail
  evaluatedAt: string
  loading: boolean
  onRefresh: () => void
}) {
  const { locale } = useLocaleInfo()
  const shopUrl =
    store.platform === 'shopify' && store.shop_domain
      ? `https://${store.shop_domain}`
      : null

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <StoreIcon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
            Store details
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold text-slate-950">
            {store.store_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PlatformBadge platform={store.platform} />
            <LifecycleBadge status={store.lifecycle_status} />
            <HealthBadge status={store.health.status} />
          </div>
          <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
            {shopUrl ? (
              <a
                href={shopUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-w-0 items-center gap-1 rounded font-mono hover:text-emerald-700 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                <span className="truncate">{store.shop_domain}</span>
                <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
              </a>
            ) : (
              <span className="truncate font-mono">
                {store.shop_domain ?? store.source_identity}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
        <span className="text-xs text-slate-500">
          Last updated {formatDateTime(evaluatedAt)}
        </span>
        <div className="flex flex-wrap gap-2">
          {store.billing.model === 'credits' && (
            <Button asChild variant="outline">
              <Link
                href={`/${locale}/admin/standalone-billing/${store.org_id}`}
              >
                <Wallet aria-hidden="true" />
                Billing account
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw
              className={cn(loading && 'animate-spin')}
              aria-hidden="true"
            />
            {loading ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>
    </header>
  )
}

function StoreKpis({ store }: { store: AdminStoreDetail }) {
  const totals = store.verification_totals
  const confirmed = totals.by_status.confirmed ?? 0
  const canceled = totals.by_status.canceled ?? 0
  const resolved = confirmed + canceled
  const confirmationRate =
    resolved > 0 ? `${Math.round((confirmed / resolved) * 100)}%` : '—'
  const failedRate =
    totals.total_24h > 0
      ? Math.round((totals.failed_24h / totals.total_24h) * 100)
      : 0

  return (
    <section
      aria-label="Key metrics"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      <AdminMetricCard
        label="Verifications"
        value={numberFormat.format(totals.total)}
        detail={`${numberFormat.format(totals.test)} test messages excluded`}
        icon={ListChecks}
        tone="blue"
      />
      <AdminMetricCard
        label="Confirmation rate"
        value={confirmationRate}
        detail={`${numberFormat.format(confirmed)} confirmed · ${numberFormat.format(canceled)} canceled`}
        icon={CheckCircle2}
        tone="emerald"
      />
      <AdminMetricCard
        label="Failed (24h)"
        value={numberFormat.format(totals.failed_24h)}
        detail={`${failedRate}% of ${numberFormat.format(totals.total_24h)} sent in 24h`}
        icon={CircleAlert}
        tone={totals.failed_24h > 0 ? 'red' : 'neutral'}
      />
      {store.billing.model === 'credits' ? (
        <AdminMetricCard
          label="Credits available"
          value={numberFormat.format(store.billing.available)}
          detail={`${numberFormat.format(store.billing.held)} held`}
          icon={Coins}
          tone={
            store.billing.balance_state === 'ok'
              ? 'emerald'
              : store.billing.balance_state === 'low'
                ? 'amber'
                : 'red'
          }
        />
      ) : (
        <AdminMetricCard
          label="Plan usage"
          value={`${store.billing.usage.percent}%`}
          detail={`${numberFormat.format(store.billing.usage.used)} of ${
            store.billing.usage.limit
              ? numberFormat.format(store.billing.usage.limit)
              : 'unknown'
          } this period`}
          icon={Gauge}
          tone={
            store.billing.usage.percent >= 95
              ? 'red'
              : store.billing.usage.percent >= 80
                ? 'amber'
                : 'neutral'
          }
        />
      )}
    </section>
  )
}

function DetailCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-xs',
        className
      )}
    >
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function DetailList({
  items,
}: {
  items: ReadonlyArray<[string, React.ReactNode]>
}) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0"
        >
          <dt className="shrink-0 text-xs text-slate-500">{label}</dt>
          <dd className="min-w-0 text-end text-sm font-medium break-words text-slate-800">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ProfileCard({ store }: { store: AdminStoreDetail }) {
  return (
    <DetailCard title="Store profile">
      <DetailList
        items={[
          ['Organization', store.organization_name],
          ['Owner', store.owner_email ?? 'Unknown'],
          ['Platform', platformLabel(store.platform)],
          ['Country', store.country_code ?? 'Unknown'],
          ['Timezone', store.timezone ?? 'Unknown'],
          [
            isInstalledPlatform(store.platform) ? 'Installed' : 'Created',
            formatDate(store.installed_at),
          ],
          ['Onboarding', titleCase(store.onboarding_status)],
          ['Last activity', formatDateTime(store.last_activity_at)],
        ]}
      />
    </DetailCard>
  )
}

function BillingCard({ store }: { store: AdminStoreDetail }) {
  const billing = store.billing
  if (billing.model === 'credits') {
    return (
      <DetailCard title="Billing · Prepaid credits">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-slate-950 tabular-nums">
              {numberFormat.format(billing.available)}
            </p>
            <p className="text-xs text-slate-500">credits available</p>
          </div>
          <CreditBalanceBadge state={billing.balance_state} />
        </div>
        <DetailList
          items={[
            ['Account status', titleCase(billing.account_status)],
            ['Held for sends', numberFormat.format(billing.held)],
            [
              'Debt',
              billing.debt > 0 ? (
                <span className="text-red-700">
                  {numberFormat.format(billing.debt)}
                </span>
              ) : (
                'None'
              ),
            ],
          ]}
        />
      </DetailCard>
    )
  }
  return (
    <DetailCard title="Billing · Plan">
      <div className="mb-4">
        <UsageMeter usage={billing.usage} />
        <p className="mt-1.5 text-xs text-slate-500">
          {numberFormat.format(billing.usage.remaining)} verifications remaining
          this period
        </p>
      </div>
      <DetailList
        items={[
          ['Plan', titleCase(billing.plan)],
          ['Subscription', titleCase(billing.subscription_status)],
          ['Billing activated', formatDate(store.billing_activated_at)],
        ]}
      />
    </DetailCard>
  )
}

function OnOff({ enabled, detail }: { enabled: boolean; detail?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'size-1.5 rounded-full',
          enabled ? 'bg-emerald-500' : 'bg-slate-300'
        )}
        aria-hidden="true"
      />
      {enabled ? 'On' : 'Off'}
      {enabled && detail && (
        <span className="font-normal text-slate-500">· {detail}</span>
      )}
    </span>
  )
}

function minutesLabel(minutes: number) {
  if (minutes <= 0) return 'Immediately'
  if (minutes % 60 === 0) return `${minutes / 60}h`
  return `${minutes} min`
}

function AutomationCard({ store }: { store: AdminStoreDetail }) {
  const settings = store.settings
  return (
    <DetailCard title="Automation">
      <DetailList
        items={[
          [
            'Auto-confirmation',
            <OnOff key="auto" enabled={store.auto_confirmation_enabled} />,
          ],
          [
            'Follow-up',
            <OnOff
              key="follow"
              enabled={settings.follow_up_enabled}
              detail={`after ${minutesLabel(settings.follow_up_delay_minutes)}`}
            />,
          ],
          [
            'Escalation',
            <OnOff key="escalation" enabled={settings.escalation_enabled} />,
          ],
          [
            'Quiet hours',
            <OnOff
              key="quiet"
              enabled={settings.quiet_hours_enabled}
              detail={
                settings.quiet_hours_start && settings.quiet_hours_end
                  ? `${settings.quiet_hours_start}–${settings.quiet_hours_end}`
                  : undefined
              }
            />,
          ],
          ['Send delay', minutesLabel(settings.send_delay_minutes)],
          ['Message language', titleCase(settings.default_language)],
          ['Test message', titleCase(store.test_message_status)],
        ]}
      />
    </DetailCard>
  )
}

function HealthCard({ store }: { store: AdminStoreDetail }) {
  const signals = store.health.signals
  return (
    <DetailCard title="Health">
      <div className="flex items-center justify-between gap-3">
        <HealthBadge status={store.health.status} />
        <span className="text-xs text-slate-500">
          {signals.length === 0
            ? 'No active signals'
            : `${signals.length} active signal${signals.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {signals.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {signals.map((signal) => (
            <li
              key={signal}
              className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <CircleAlert
                className="mt-0.5 size-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              {signalLabels[signal] ?? titleCase(signal)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Everything looks good.
        </p>
      )}
      {store.data_quality.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Some milestones are estimated from retained records.
        </p>
      )}
    </DetailCard>
  )
}

function LifecycleCard({ milestones }: { milestones: AdminStoreMilestone[] }) {
  const visible = milestones.filter(
    (milestone) => milestone.key !== 'uninstalled' || milestone.at
  )
  return (
    <DetailCard title="Lifecycle timeline">
      <ol className="relative space-y-4">
        {visible.map((milestone, index) => {
          const reached = Boolean(milestone.at)
          return (
            <li key={milestone.key} className="relative flex gap-3">
              {index < visible.length - 1 && (
                <span
                  className={cn(
                    'absolute start-[7px] top-5 -bottom-4 w-px',
                    reached ? 'bg-emerald-200' : 'bg-slate-200'
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'relative mt-1 size-3.5 shrink-0 rounded-full border-2',
                  reached
                    ? milestone.key === 'uninstalled'
                      ? 'border-slate-500 bg-slate-500'
                      : 'border-emerald-500 bg-emerald-500'
                    : 'border-slate-300 bg-white'
                )}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm',
                    reached ? 'font-medium text-slate-900' : 'text-slate-500'
                  )}
                >
                  {milestoneLabels[milestone.key] ?? titleCase(milestone.key)}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  {reached ? formatDateTime(milestone.at) : 'Not reached'}
                  {milestone.estimated && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-800"
                    >
                      Estimated
                    </Badge>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </DetailCard>
  )
}

const statusTones: Record<string, string> = {
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  canceled: 'border-red-200 bg-red-50 text-red-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
  expired: 'border-amber-200 bg-amber-50 text-amber-800',
  no_reply: 'border-amber-200 bg-amber-50 text-amber-800',
  pending: 'border-slate-200 bg-slate-50 text-slate-700',
  sent: 'border-blue-200 bg-blue-50 text-blue-700',
  delivered: 'border-blue-200 bg-blue-50 text-blue-700',
  read: 'border-blue-200 bg-blue-50 text-blue-700',
}

function VerificationStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'whitespace-nowrap',
        statusTones[status] ?? 'border-slate-200 bg-slate-50 text-slate-700'
      )}
    >
      {titleCase(status)}
    </Badge>
  )
}

function formatAmount(verification: AdminStoreVerification) {
  if (verification.total_price === null) return '—'
  const amount = Number(verification.total_price)
  if (!Number.isFinite(amount)) return verification.total_price
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: verification.currency ?? 'SAR',
    }).format(amount)
  } catch {
    return `${numberFormat.format(amount)} ${verification.currency ?? ''}`.trim()
  }
}

function latestUpdate(verification: AdminStoreVerification) {
  const candidates = [
    verification.confirmed_at,
    verification.canceled_at,
    verification.expired_at,
    verification.no_reply_at,
    verification.follow_up_sent_at,
    verification.read_at,
    verification.delivered_at,
    verification.last_sent_at,
  ].filter((value): value is string => Boolean(value))
  return candidates.sort().at(-1) ?? verification.updated_at
}

function VerificationsSection({
  integrationId,
  store,
  revision,
}: {
  integrationId: string
  store: AdminStoreDetail
  revision: number
}) {
  const [filters, setFilters] = useState<AdminStoreVerificationFilters>({
    status: '',
    includeTest: false,
  })
  const {
    response,
    loading,
    loadingMore,
    error,
    paginationError,
    reload,
    loadMore,
  } = useAdminStoreVerifications(integrationId, filters, revision)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const hasFilters = filters.status !== '' || filters.includeTest

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <section
      aria-labelledby="store-verifications-heading"
      className="rounded-2xl border border-slate-200 bg-white shadow-xs"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2
            id="store-verifications-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Verifications
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {response
              ? `${numberFormat.format(response.total_count)} matching · customer phones are masked`
              : 'Customer phones are masked'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {loading && response && (
            <Loader2
              className="size-4 animate-spin text-slate-400"
              aria-label="Updating"
            />
          )}
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:border-slate-300">
            <input
              type="checkbox"
              className="size-4 accent-emerald-700"
              checked={filters.includeTest}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  includeTest: event.target.checked,
                }))
              }
            />
            <FlaskConical
              className="size-4 text-slate-400"
              aria-hidden="true"
            />
            Include test orders
          </label>
          <AdminSelect
            label="Verification status"
            hideLabel
            className="w-44"
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            options={verificationStatusOptions}
          />
        </div>
      </div>

      {error && response && (
        <div className="p-4">
          <AdminErrorPanel
            compact
            message={error.message}
            requestId={error.requestId}
            onRetry={() => void reload()}
          />
        </div>
      )}

      {loading && !response ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : error && !response ? (
        <div className="p-4">
          <AdminErrorPanel
            message={error.message}
            requestId={error.requestId}
            onRetry={() => void reload()}
          />
        </div>
      ) : response && response.data.length === 0 ? (
        <div className="p-4">
          <AdminEmptyState
            icon={ListChecks}
            title={
              hasFilters
                ? 'No verifications match these filters'
                : 'No verifications yet'
            }
            description={
              hasFilters
                ? 'Change the status or include test orders to broaden the results.'
                : `Verifications will appear once ${store.store_name} receives eligible COD orders.`
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => setFilters({ status: '', includeTest: false })}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : response ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px] text-start text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-start">Order</th>
                  <th className="px-4 py-3 text-start">Customer</th>
                  <th className="px-4 py-3 text-end">Amount</th>
                  <th className="px-4 py-3 text-start">Status</th>
                  <th className="px-4 py-3 text-end">Attempts</th>
                  <th className="px-4 py-3 text-start">Created</th>
                  <th className="px-4 py-3 text-start">Last update</th>
                  <th className="w-12 px-3 py-3">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {response.data.map((verification) => {
                  const isExpanded = expanded.has(verification.id)
                  const detailId = `verification-${verification.id}`
                  return (
                    <Fragment key={verification.id}>
                      <tr
                        className={cn(
                          'align-middle transition-colors hover:bg-slate-50/80',
                          isExpanded && 'bg-slate-50/70'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {verification.order_number ??
                                verification.external_order_id}
                            </span>
                            {verification.is_test && <TestBadge />}
                          </div>
                        </td>
                        <td className="max-w-56 px-4 py-3">
                          <p className="truncate text-slate-800">
                            {verification.customer_name ?? 'Unknown'}
                          </p>
                          <p
                            className="mt-0.5 font-mono text-xs text-slate-500"
                            dir="ltr"
                          >
                            {verification.customer_phone_masked || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-end font-medium whitespace-nowrap text-slate-800 tabular-nums">
                          {formatAmount(verification)}
                        </td>
                        <td className="px-4 py-3">
                          <VerificationStatusBadge
                            status={verification.status}
                          />
                        </td>
                        <td className="px-4 py-3 text-end text-slate-700 tabular-nums">
                          {verification.attempts}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-600">
                          {formatDateTime(verification.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-600">
                          {formatDateTime(latestUpdate(verification))}
                        </td>
                        <td className="px-3 py-3 text-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => toggle(verification.id)}
                            aria-expanded={isExpanded}
                            aria-controls={detailId}
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} details for order ${verification.order_number ?? verification.external_order_id}`}
                          >
                            <ChevronRight
                              className={cn(
                                'transition-transform rtl:rotate-180',
                                isExpanded && 'rotate-90 rtl:rotate-90'
                              )}
                            />
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr id={detailId}>
                          <td colSpan={8} className="bg-slate-50 px-5 py-4">
                            <VerificationDetails verification={verification} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 md:hidden">
            {response.data.map((verification) => {
              const isExpanded = expanded.has(verification.id)
              const detailId = `mobile-verification-${verification.id}`
              return (
                <li key={verification.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-slate-900">
                          {verification.order_number ??
                            verification.external_order_id}
                        </p>
                        {verification.is_test && <TestBadge />}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {verification.customer_name ?? 'Unknown'} ·{' '}
                        <span className="font-mono" dir="ltr">
                          {verification.customer_phone_masked || '—'}
                        </span>
                      </p>
                    </div>
                    <VerificationStatusBadge status={verification.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium text-slate-800 tabular-nums">
                      {formatAmount(verification)}
                    </span>
                    <span>{formatDateTime(verification.created_at)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full justify-between px-1"
                    onClick={() => toggle(verification.id)}
                    aria-expanded={isExpanded}
                    aria-controls={detailId}
                  >
                    {isExpanded ? 'Hide timeline' : 'View timeline'}
                    <ChevronRight
                      className={cn(
                        'transition-transform',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </Button>
                  {isExpanded && (
                    <div
                      id={detailId}
                      className="mt-2 rounded-lg bg-slate-50 p-3"
                    >
                      <VerificationDetails verification={verification} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="flex flex-col items-center gap-3 border-t border-slate-200 p-4 sm:flex-row sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing {numberFormat.format(response.data.length)} of{' '}
              {numberFormat.format(response.total_count)}
            </p>
            {response.next_cursor && (
              <Button
                variant="outline"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore && <Loader2 className="animate-spin" />}
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            )}
          </div>
          {paginationError && (
            <div className="px-4 pb-4">
              <AdminErrorPanel
                compact
                message={paginationError.message}
                requestId={paginationError.requestId}
                onRetry={() => void loadMore()}
              />
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}

function TestBadge() {
  return (
    <Badge
      variant="outline"
      className="border-violet-200 bg-violet-50 px-1.5 py-0 text-[10px] text-violet-700"
    >
      Test
    </Badge>
  )
}

function VerificationDetails({
  verification,
}: {
  verification: AdminStoreVerification
}) {
  const timeline: Array<[string, string | null]> = [
    ['Created', verification.created_at],
    ['Last sent', verification.last_sent_at],
    ['Delivered', verification.delivered_at],
    ['Read', verification.read_at],
    ['Follow-up sent', verification.follow_up_sent_at],
    ['Confirmed', verification.confirmed_at],
    ['Canceled', verification.canceled_at],
    ['No reply', verification.no_reply_at],
    ['Expired', verification.expired_at],
  ]
  const reached = timeline.filter(([, value]) => value)
  const facts: Array<[string, string]> = [
    ['External order ID', verification.external_order_id],
    ['Template', verification.template_name ?? 'Unknown'],
    ['Language', verification.language_code?.toUpperCase() ?? 'Unknown'],
    [
      'Attempts',
      `${verification.attempts} sends · ${verification.follow_up_attempts} follow-ups`,
    ],
  ]
  if (verification.cancellation_source)
    facts.push(['Canceled by', titleCase(verification.cancellation_source)])
  if (verification.reason)
    facts.push(['Reason', titleCase(verification.reason)])

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Timeline
        </h3>
        <ol className="mt-2 space-y-1.5">
          {reached.map(([label, value]) => (
            <li
              key={label}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-slate-600">{label}</span>
              <span className="text-xs text-slate-800 tabular-nums">
                {formatDateTime(value)}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Message
        </h3>
        <dl className="mt-2 space-y-1.5">
          {facts.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <dt className="text-slate-600">{label}</dt>
              <dd className="min-w-0 truncate text-end text-slate-800">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
