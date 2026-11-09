import type { ChangeRequestSummary } from '../model/dashboard.model'

/** Whether the customer got the "request received" reply. */
export type ChangeRequestAckView = 'sent' | 'skipped' | 'failed' | 'pending'

/**
 * Where the merchant's updated confirmation stands, as the panel shows it.
 * `idle` when none was asked for (or the last one is being retried).
 */
export type ResendView =
  | { kind: 'idle' }
  | { kind: 'queued' }
  | { kind: 'scheduled'; at: string | null }
  | {
      kind: 'failed'
      reason: 'store' | 'balance' | 'send'
      /** Whether trying again can help; a missing store order cannot. */
      retryable: boolean
    }

export function changeRequestAckView(
  summary: Pick<ChangeRequestSummary, 'acknowledgment'>
): ChangeRequestAckView {
  const ack = summary.acknowledgment
  if (!ack) return 'pending'
  if (ack.status === 'done') return 'sent'
  if (ack.status === 'skipped') return 'skipped'
  if (ack.status === 'failed') return 'failed'
  return 'pending'
}

/** The customer was told nothing: worth a warning wherever the row shows. */
export function isAckMissing(summary: ChangeRequestSummary): boolean {
  const view = changeRequestAckView(summary)
  return view === 'skipped' || view === 'failed'
}

export function resendView(
  summary: Pick<ChangeRequestSummary, 'reconfirmation'>
): ResendView {
  const { state, scheduled_for, last_error } = summary.reconfirmation
  if (state === 'requested' || state === 'sending') return { kind: 'queued' }
  if (state === 'scheduled') return { kind: 'scheduled', at: scheduled_for }
  if (state !== 'failed') return { kind: 'idle' }
  switch (last_error) {
    case 'order_source_unavailable':
      return { kind: 'failed', reason: 'store', retryable: true }
    case 'order_not_found':
    case 'order_not_eligible':
      return { kind: 'failed', reason: 'store', retryable: false }
    case 'no_allowance':
      return { kind: 'failed', reason: 'balance', retryable: true }
    default:
      return { kind: 'failed', reason: 'send', retryable: true }
  }
}

/** A resend is in flight: asking again would only join it. */
export function isResendBusy(view: ResendView): boolean {
  return view.kind === 'queued' || view.kind === 'scheduled'
}
