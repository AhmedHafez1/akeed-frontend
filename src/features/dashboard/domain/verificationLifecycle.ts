import type {
  VerificationRowAction,
  VerificationRowCapability,
  VerificationStatus,
} from '../model/dashboard.model'

/**
 * One lifecycle vocabulary for both runtime modes.
 *
 * Tones are semantic, not visual. Each skin maps them onto its own design
 * system — Polaris badges embedded, Tailwind classes standalone — which keeps
 * mode-branching out of the skin JSX while guaranteeing that the same state
 * never reads as two different things.
 */
export type LifecycleTone =
  | 'neutral'
  | 'info'
  | 'progress'
  | 'success'
  | 'warning'
  | 'attention'
  | 'critical'

const LIFECYCLE_TONES: Record<VerificationStatus, LifecycleTone> = {
  pending: 'neutral',
  sent: 'info',
  delivered: 'info',
  read: 'progress',
  confirmed: 'success',
  canceled: 'critical',
  failed: 'critical',
  expired: 'warning',
  no_reply: 'attention',
}

export function lifecycleTone(status: VerificationStatus): LifecycleTone {
  return LIFECYCLE_TONES[status] ?? 'neutral'
}

/** A customer reply is the final word; nothing further will change on its own. */
export function isTerminalLifecycleStatus(status: VerificationStatus): boolean {
  return status === 'confirmed' || status === 'canceled'
}

/**
 * Whether the row is still expected to change without any merchant action.
 *
 * Drives background refresh: a table showing only settled rows has nothing to
 * poll for, while one awaiting a customer reply must repaint when it arrives.
 */
export function isAwaitingOutcome(status: VerificationStatus): boolean {
  return (
    status === 'pending' ||
    status === 'sent' ||
    status === 'delivered' ||
    status === 'read'
  )
}

/**
 * Whether the API reported an action as available on this row.
 *
 * The server owns the decision — it knows the platform, the source state and
 * the failure reason — so neither skin re-derives it from the status.
 */
export function hasCapability(
  capabilities: VerificationRowCapability[] | undefined,
  action: VerificationRowAction
): boolean {
  if (capabilities === undefined) return false
  return capabilities.some(
    (capability) => capability.action === action && capability.supported
  )
}

/**
 * Merchant cancellation is offered only after a no-reply escalation, and only
 * when the commerce source can actually carry the outcome back.
 */
export function canMarkOrderCanceled(
  status: VerificationStatus,
  capabilities: VerificationRowCapability[] | undefined
): boolean {
  if (status !== 'no_reply') return false
  // A row loaded before capabilities existed is assumed cancellable; the
  // server rejects it if not, and hiding the only recovery action would be
  // worse than showing one that may fail.
  if (capabilities === undefined) return true
  return hasCapability(capabilities, 'merchant_no_reply_cancellation')
}

/** Re-sending is offered only for failures the merchant can actually clear. */
export function canRetryVerification(
  capabilities: VerificationRowCapability[] | undefined
): boolean {
  return hasCapability(capabilities, 'retry_verification')
}

/** Reason codes the UI has a localized explanation for. */
export const EXPLAINED_LIFECYCLE_REASONS = new Set([
  'non_cod_payment_method',
  'missing_payment_signal',
  'plan_limit_reached',
  'integration_inactive',
  'billing_not_active',
  'provider_not_accepted',
  'auto_verify_disabled',
  'onboarding_incomplete',
  'provider_outcome_unknown',
])

export type { VerificationStatus }
