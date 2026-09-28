import type {
  LifecycleStatus,
  NeedsActionReason,
  VerificationItem,
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
  | 'muted'

const LIFECYCLE_TONES: Record<LifecycleStatus, LifecycleTone> = {
  // Held before any message: waiting on the merchant, not on the customer.
  awaiting_start: 'neutral',
  // Withdrawn before release; nothing was or will be sent.
  not_started: 'muted',
  // In line behind a started import, then on its way.
  queued: 'neutral',
  sending: 'info',
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

export function lifecycleTone(status: LifecycleStatus): LifecycleTone {
  return LIFECYCLE_TONES[status] ?? 'neutral'
}

/**
 * The status a row reads as. A pending verification with no send time is
 * being sent right now, the same words as an order released without one;
 * with a send time it keeps its own (scheduled) reading.
 */
export function displayedLifecycleStatus(
  row: Pick<VerificationItem, 'status' | 'scheduled_for'>
): LifecycleStatus {
  return row.status === 'pending' && !row.scheduled_for ? 'sending' : row.status
}

/** A customer reply is the final word; nothing further will change on its own. */
export function isTerminalLifecycleStatus(status: LifecycleStatus): boolean {
  return status === 'confirmed' || status === 'canceled'
}

/**
 * Whether the row is still expected to change without any merchant action.
 *
 * Drives background refresh: a table showing only settled rows has nothing to
 * poll for, while one awaiting a customer reply must repaint when it arrives.
 */
export function isAwaitingOutcome(status: LifecycleStatus): boolean {
  return (
    status === 'queued' ||
    status === 'sending' ||
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
 * Merchant cancellation is offered once the customer has gone unanswered —
 * escalated to no-reply, or already flagged for the merchant for a no-reply
 * reason — and only when the commerce source can carry the outcome back.
 */
export function canMarkOrderCanceled(
  status: LifecycleStatus,
  actionReason: NeedsActionReason | null | undefined,
  capabilities: VerificationRowCapability[] | undefined
): boolean {
  const unanswered =
    status === 'no_reply' ||
    (Boolean(actionReason) && actionReason !== 'delivery_failed')
  if (!unanswered) return false
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
  'CREDIT_ACCOUNT_NOT_PROVISIONED',
  'CREDIT_ACCOUNT_SUSPENDED',
  'CREDIT_DEBT_OUTSTANDING',
  'INSUFFICIENT_CREDITS',
  'PAYMENT_PENDING_RECONCILIATION',
  'provider_delivery_failed',
  'integration_inactive',
  'billing_not_active',
  'provider_not_accepted',
  'auto_verify_disabled',
  'onboarding_incomplete',
  'provider_outcome_unknown',
])

export type { LifecycleStatus, VerificationStatus }

export interface VerificationLifecycleStep {
  id: 'dispatch' | 'delivery' | 'outcome'
  label: 'sent' | 'delivered' | 'read' | 'outcome'
  recorded: boolean
  completedByOutcome?: 'confirmed' | 'canceled'
  timestamp: string | null
}

export function getVerificationLifecycleSteps(
  verification: VerificationItem
): VerificationLifecycleStep[] {
  const outcome =
    verification.status === 'confirmed' || verification.status === 'canceled'
      ? verification.status
      : undefined
  const sent =
    Boolean(verification.last_sent_at) || verification.status === 'sent'
  const read = Boolean(verification.read_at) || verification.status === 'read'
  const delivered =
    read ||
    Boolean(verification.delivered_at) ||
    verification.status === 'delivered'
  return [
    {
      id: 'dispatch',
      label: 'sent',
      recorded: sent || Boolean(outcome),
      completedByOutcome: sent ? undefined : outcome,
      timestamp: verification.last_sent_at,
    },
    {
      id: 'delivery',
      label: read ? 'read' : 'delivered',
      recorded: delivered || Boolean(outcome),
      completedByOutcome: delivered ? undefined : outcome,
      timestamp: verification.read_at ?? verification.delivered_at,
    },
    {
      id: 'outcome',
      label: 'outcome',
      recorded: isTerminalLifecycleStatus(verification.status),
      timestamp:
        verification.status === 'confirmed'
          ? verification.confirmed_at
          : verification.status === 'canceled'
            ? verification.canceled_at
            : null,
    },
  ]
}
