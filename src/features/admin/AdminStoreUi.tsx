import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type {
  AdminCreditBalanceState,
  AdminHealthStatus,
  AdminStore,
  AdminUsage,
} from './admin.model'

export const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
        new Date(value)
      )
    : 'Unknown'

export const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Unknown'

export const titleCase = (value: string | null) =>
  value
    ? value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Unknown'

const platformLabels: Record<string, string> = {
  shopify: 'Shopify',
  standalone: 'Standalone',
  woocommerce: 'WooCommerce',
  easyorders: 'EasyOrders',
  salla: 'Salla',
  zid: 'Zid',
}

export const platformLabel = (platform: string) =>
  platformLabels[platform] ?? titleCase(platform)

export const isInstalledPlatform = (platform: string) =>
  platform !== 'standalone'

export function storeSubtitle(store: AdminStore) {
  return store.shop_domain ?? store.organization_name
}

export function HealthBadge({ status }: { status: AdminHealthStatus }) {
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

export function LifecycleBadge({ status }: { status: string }) {
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

export function PlatformBadge({ platform }: { platform: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-slate-200 bg-white px-1.5 py-0 text-[11px] font-medium whitespace-nowrap text-slate-600',
        platform === 'shopify' &&
          'border-emerald-200 bg-emerald-50/60 text-emerald-800',
        platform === 'standalone' &&
          'border-violet-200 bg-violet-50 text-violet-700'
      )}
    >
      {platformLabel(platform)}
    </Badge>
  )
}

const balanceStateLabels: Record<AdminCreditBalanceState, string> = {
  none: 'No account',
  ok: 'Healthy balance',
  low: 'Low balance',
  zero: 'No credits',
  debt: 'In debt',
}

export function CreditBalanceBadge({
  state,
}: {
  state: AdminCreditBalanceState
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-slate-200 bg-slate-50 whitespace-nowrap text-slate-600',
        state === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        state === 'low' && 'border-amber-200 bg-amber-50 text-amber-800',
        (state === 'zero' || state === 'debt') &&
          'border-red-200 bg-red-50 text-red-700'
      )}
    >
      {balanceStateLabels[state]}
    </Badge>
  )
}

export function UsageMeter({ usage }: { usage: AdminUsage }) {
  const width = Math.min(Math.max(usage.percent, 0), 100)
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-800 tabular-nums">
          {usage.used.toLocaleString('en')} /{' '}
          {usage.limit ? usage.limit.toLocaleString('en') : 'Unknown'}
        </span>
        {usage.limit > 0 && (
          <span className="text-slate-500 tabular-nums">{usage.percent}%</span>
        )}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            'h-full rounded-full',
            usage.percent >= 100
              ? 'bg-red-500'
              : usage.percent >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export function BillingCell({ store }: { store: AdminStore }) {
  if (store.billing.model === 'credits') {
    return (
      <div>
        <p className="text-xs font-medium text-slate-800 tabular-nums">
          {store.billing.available.toLocaleString('en')} credits
        </p>
        <div className="mt-1.5">
          <CreditBalanceBadge state={store.billing.balance_state} />
        </div>
      </div>
    )
  }
  return <UsageMeter usage={store.billing.usage} />
}

export function PlanCell({ store }: { store: AdminStore }) {
  if (store.billing.model === 'credits') {
    return (
      <>
        <p className="font-medium text-slate-800">Prepaid credits</p>
        <p className="mt-1 text-xs text-slate-500">
          {titleCase(store.billing.account_status)}
        </p>
      </>
    )
  }
  return (
    <>
      <p className="font-medium text-slate-800">
        {titleCase(store.billing.plan)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {titleCase(store.billing.subscription_status)}
      </p>
    </>
  )
}
