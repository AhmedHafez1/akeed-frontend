import type {
  ManualOrderLifecycleStatus,
  VerificationStatus,
} from '../model/dashboard.model'

/**
 * One lifecycle vocabulary for both runtime modes.
 *
 * `ManualOrderLifecycleStatus` is a superset of `VerificationStatus`: the extra
 * members describe an order that has not reached a verification yet, or one held
 * for review. Embedded renders verification statuses and standalone renders the
 * full lifecycle, but both draw from this single table so the same state never
 * gets two different meanings.
 *
 * Tones are semantic, not visual. Each skin maps them onto its own design
 * system — Polaris badges embedded, Tailwind classes standalone — which keeps
 * mode-branching out of the skin JSX.
 */
export type LifecycleTone =
  | 'neutral'
  | 'info'
  | 'progress'
  | 'success'
  | 'warning'
  | 'attention'
  | 'critical'

const LIFECYCLE_TONES: Record<ManualOrderLifecycleStatus, LifecycleTone> = {
  accepted: 'neutral',
  processing: 'progress',
  pending: 'neutral',
  sent: 'info',
  delivered: 'info',
  read: 'progress',
  confirmed: 'success',
  canceled: 'critical',
  failed: 'critical',
  expired: 'warning',
  no_reply: 'attention',
  blocked: 'attention',
  ineligible: 'neutral',
  review_required: 'warning',
}

export function lifecycleTone(
  status: ManualOrderLifecycleStatus
): LifecycleTone {
  return LIFECYCLE_TONES[status] ?? 'neutral'
}

/** A customer reply is the final word; nothing further will change on its own. */
export function isTerminalLifecycleStatus(
  status: ManualOrderLifecycleStatus
): boolean {
  return status === 'confirmed' || status === 'canceled'
}

/**
 * Whether the row is still expected to change without any merchant action.
 *
 * Drives background refresh: a table showing only settled rows has nothing to
 * poll for, while one awaiting a customer reply must repaint when it arrives.
 */
export function isAwaitingOutcome(
  status: ManualOrderLifecycleStatus
): boolean {
  return (
    status === 'accepted' ||
    status === 'processing' ||
    status === 'pending' ||
    status === 'sent' ||
    status === 'delivered' ||
    status === 'read'
  )
}

interface OutcomeCapability {
  action: string
  supported: boolean
}

/**
 * Merchant cancellation is offered only after a no-reply escalation, and only
 * when the commerce source can actually carry the outcome back.
 */
export function canMarkOrderCanceled(
  status: ManualOrderLifecycleStatus,
  capabilities: OutcomeCapability[] | undefined
): boolean {
  if (status !== 'no_reply') return false
  if (capabilities === undefined) return true
  return capabilities.some(
    (capability) =>
      capability.action === 'merchant_no_reply_cancellation' &&
      capability.supported
  )
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

export type { ManualOrderLifecycleStatus, VerificationStatus }
