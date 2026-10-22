import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { countryName } from '@/shared/lib/country'
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

/** Stands in when the API predates customer countries, so the page still renders. */
const noCountries: AdminStore['customer_countries'] = {
  top: null,
  share: null,
  count: 0,
}

/** `Guatemala 82% · 3 countries`, or null before any order has a country. */
export function customerCountriesLabel(store: AdminStore) {
  const { top, share, count } = store.customer_countries ?? noCountries
  if (!top) return null
  const name = countryName(top) ?? top
  const lead = share === null ? name : `${name} ${share}%`
  return count > 1 ? `${lead} · ${count} countries` : lead
}

/** One-line marker for a store row: `GT 82% +2`. */
export function CustomerCountryMarker({ store }: { store: AdminStore }) {
  const { top, share, count } = store.customer_countries ?? noCountries
  if (!top) return null
  return (
    <span
      className="text-muted-foreground shrink-0 text-xs whitespace-nowrap tabular-nums"
      title={`Customers: ${customerCountriesLabel(store)}`}
    >
      <span className="text-foreground/80 font-medium">{top}</span>
      {share !== null && ` ${share}%`}
      {count > 1 && ` +${count - 1}`}
    </span>
  )
}

/** The country code shown before a masked phone, named in its tooltip. */
export function CustomerCountryCode({ code }: { code: string | null }) {
  if (!code) return null
  return (
    <abbr
      className="text-foreground/80 me-1 font-sans font-medium no-underline"
      title={countryName(code) ?? code}
    >
      {code}
    </abbr>
  )
}

export function HealthBadge({ status }: { status: AdminHealthStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 whitespace-nowrap',
        status === 'healthy' &&
          'border-primary-border bg-primary-subtle text-primary',
        status === 'attention_required' &&
          'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
        status === 'critical' &&
          'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground'
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'healthy' && 'bg-primary',
          status === 'attention_required' && 'bg-secondary',
          status === 'critical' && 'bg-destructive'
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
        'border-border bg-muted/50 text-foreground/80 whitespace-nowrap',
        status === 'active' &&
          'border-primary-border bg-primary-subtle text-primary',
        status === 'onboarding' &&
          'border-info-border bg-info-subtle text-info-subtle-foreground',
        status === 'inactive' &&
          'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
        status === 'uninstalled' && 'border-border bg-muted text-foreground/70'
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
        'border-border bg-card text-foreground/70 px-1.5 py-0 text-[11px] font-medium whitespace-nowrap',
        platform === 'shopify' &&
          'border-primary-border bg-primary-subtle/60 text-primary-subtle-foreground',
        platform === 'standalone' &&
          'border-info-border bg-info-subtle text-info-subtle-foreground'
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
        'border-border bg-muted/50 text-foreground/70 whitespace-nowrap',
        state === 'ok' &&
          'border-primary-border bg-primary-subtle text-primary',
        state === 'low' &&
          'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
        (state === 'zero' || state === 'debt') &&
          'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground'
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
        <span className="text-foreground font-medium tabular-nums">
          {usage.used.toLocaleString('en')} /{' '}
          {usage.limit ? usage.limit.toLocaleString('en') : 'Unknown'}
        </span>
        {usage.limit > 0 && (
          <span className="text-muted-foreground tabular-nums">
            {usage.percent}%
          </span>
        )}
      </div>
      <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full',
            usage.percent >= 100
              ? 'bg-destructive'
              : usage.percent >= 80
                ? 'bg-secondary'
                : 'bg-primary'
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
        <p className="text-foreground text-xs font-medium tabular-nums">
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
        <p className="text-foreground font-medium">Prepaid credits</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {titleCase(store.billing.account_status)}
        </p>
      </>
    )
  }
  return (
    <>
      <p className="text-foreground font-medium">
        {titleCase(store.billing.plan)}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        {titleCase(store.billing.subscription_status)}
      </p>
    </>
  )
}
