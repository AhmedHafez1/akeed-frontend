import { titleCase } from './AdminStoreUi'
import type {
  AdminSignalDetails,
  AdminSignalLevel,
  AdminStore,
} from './admin.model'

/** Every health signal the API reports, critical rules first. */
export const ADMIN_SIGNALS = [
  'orders_not_eligible',
  'paid_store_uninstalled',
  'reinstalled_without_plan',
  'store_uninstalled',
  'onboarding_incomplete',
  'no_eligible_order',
  'usage_critical',
  'usage_attention',
  'failed_verification_rate',
  'webhook_failures',
  'subscription_blocked',
  'credits_exhausted',
  'credits_low',
  'template_unavailable',
  'auto_confirmation_disabled',
  'no_recent_activity',
] as const

const signalLabels: Record<string, string> = {
  orders_not_eligible: 'Orders arriving but not confirmed',
  paid_store_uninstalled: 'Paying store uninstalled',
  reinstalled_without_plan: 'Reinstalled without a plan',
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
  template_unavailable: 'Message template unavailable',
  no_recent_activity: 'No recent activity',
}

export const signalLabel = (signal: string) =>
  signalLabels[signal] ?? titleCase(signal)

export const signalOptions = [
  { value: '', label: 'All signals' },
  ...ADMIN_SIGNALS.map((signal) => ({
    value: signal,
    label: signalLabel(signal),
  })),
]

const skipReasonLabels: Record<string, string> = {
  non_cod_payment_method: 'not COD',
  missing_payment_signal: 'no payment method',
  auto_verify_disabled: 'auto-confirmation off',
  onboarding_incomplete: 'setup not finished',
  billing_not_active: 'no active plan',
  integration_inactive: 'store inactive',
  normalisation_failed: 'no valid phone',
  invalid_phone: 'invalid phone',
  incomplete_payload: 'incomplete order',
  order_not_placed: 'order not placed',
  order_predates_connection: 'older than the connection',
}

/** A skip code in a few plain words. */
export const skipReasonLabel = (reason: string) =>
  skipReasonLabels[reason] ?? titleCase(reason).toLowerCase()

/** `critical` unless the API says the signal only needs attention. */
export function signalLevel(
  store: Pick<AdminStore, 'health'>,
  signal: string
): AdminSignalLevel {
  const level = store.health.levels?.[signal]
  if (level) return level
  return store.health.status === 'attention_required' ? 'attention' : 'critical'
}

const HOUR = 3_600_000
const DAY = 24 * HOUR

function ago(at: string | null, now: Date): string | null {
  if (!at) return null
  const elapsed = now.getTime() - new Date(at).getTime()
  if (!Number.isFinite(elapsed)) return null
  if (elapsed < HOUR) return 'just now'
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  const days = Math.floor(elapsed / DAY)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const shortDate = (at: string | null) =>
  at
    ? new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
      }).format(new Date(at))
    : null

const join = (parts: Array<string | null | false>) =>
  parts.filter(Boolean).join(' · ')

/**
 * The facts behind a signal in one short line, for example
 * "12 of 13 orders skipped in 24h · top reason: not COD (payment method:
 * manual)". Null when the API sent none.
 */
export function signalDetail(
  signal: string,
  details: AdminSignalDetails | undefined,
  now: Date = new Date()
): string | null {
  if (!details) return null
  switch (signal) {
    case 'orders_not_eligible': {
      const d = details.orders_not_eligible
      if (!d) return null
      const reason = d.top_reason
        ? `top reason: ${skipReasonLabel(d.top_reason)}${
            d.top_payment_method && d.top_payment_method !== 'unknown'
              ? ` (payment method: ${d.top_payment_method})`
              : ''
          }`
        : null
      return join([
        `${d.skipped} of ${d.received} orders skipped in 24h`,
        reason,
      ])
    }
    case 'paid_store_uninstalled': {
      const d = details.paid_store_uninstalled
      if (!d) return null
      const left = d.paid_through_at
        ? Math.ceil(
            (new Date(d.paid_through_at).getTime() - now.getTime()) / DAY
          )
        : 0
      const uninstalled = ago(d.uninstalled_at, now)
      return join([
        d.plan && titleCase(d.plan),
        uninstalled && `uninstalled ${uninstalled}`,
        left > 0 && `${left} paid day${left === 1 ? '' : 's'} left`,
      ])
    }
    case 'store_uninstalled': {
      const uninstalled = ago(
        details.store_uninstalled?.uninstalled_at ?? null,
        now
      )
      return uninstalled && `Uninstalled ${uninstalled}`
    }
    case 'reinstalled_without_plan': {
      const d = details.reinstalled_without_plan
      if (!d) return null
      const reinstalled = shortDate(d.reinstalled_at)
      return join([
        d.previous_plan && `Was ${titleCase(d.previous_plan)}`,
        reinstalled && `reinstalled ${reinstalled}`,
      ])
    }
    case 'subscription_blocked': {
      const status = details.subscription_blocked?.status
      return status ? `Status: ${titleCase(status)}` : null
    }
    case 'usage_critical':
    case 'usage_attention': {
      const d = details[signal]
      return d ? `${d.percent}% of plan used` : null
    }
    case 'failed_verification_rate': {
      const d = details.failed_verification_rate
      return d ? `${d.failed} of ${d.total} failed in 24h` : null
    }
    case 'webhook_failures': {
      const d = details.webhook_failures
      return d ? `${d.count} failed in the last hour` : null
    }
    case 'credits_exhausted':
    case 'credits_low': {
      const d = details[signal]
      if (!d) return null
      return d.debt > 0
        ? `${d.debt} credits owed`
        : `${d.available} credit${d.available === 1 ? '' : 's'} left`
    }
    case 'onboarding_incomplete': {
      const since = ago(details.onboarding_incomplete?.since ?? null, now)
      return since && `Installed ${since}`
    }
    case 'no_eligible_order': {
      const since = ago(details.no_eligible_order?.since ?? null, now)
      return since && `Setup finished ${since}`
    }
    case 'no_recent_activity': {
      const since = ago(details.no_recent_activity?.since ?? null, now)
      return since && `Last activity ${since}`
    }
    default:
      return null
  }
}
