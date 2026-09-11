import type { MutationStatus } from '@tanstack/react-query'
import type {
  ManualOrderCreateInput,
  ManualOrderCreateResponse,
} from '../api/manualOrderApi'

/**
 * How long an accepted order is followed after it is submitted.
 *
 * The backend answers 202 once the order is queued; a worker creates the
 * verification afterwards and then hands the message to WhatsApp, normally
 * within seconds. Past this window the optimistic row is withdrawn and the
 * screens simply re-read, so a stalled worker can never leave a row on screen
 * that the server does not have.
 */
export const RECONCILE_TTL_MS = 60_000

/** One create-order mutation as recorded in the mutation cache. */
export type ManualOrderSubmission = {
  status: MutationStatus
  idempotencyKey: string | undefined
  payload: ManualOrderCreateInput | undefined
  response: ManualOrderCreateResponse | undefined
  submittedAt: number
}

/**
 * What has been observed on the server for each accepted order, by order id.
 *
 * `seenAt`: the verification exists (its credit is held).
 * `dispatchedAt`: it left `pending` — WhatsApp accepted or refused the send,
 * which is when the held credit is posted or released.
 */
export type OrderTracking = Readonly<
  Record<string, { seenAt: number; dispatchedAt?: number }>
>

/** An order the merchant created, as the views should account for it. */
export type PendingManualOrder = {
  idempotencyKey: string
  /** `submitting` until the 202 arrives, `queued` after it. */
  phase: 'submitting' | 'queued'
  orderId: string | null
  payload: ManualOrderCreateInput
  submittedAt: number
  /**
   * When the server was first seen listing this order, or null. A view whose
   * data was fetched at or after this moment already counts the order itself
   * and must stop adding it.
   */
  seenAt: number | null
}

/**
 * The latest submission per idempotency key.
 *
 * A retry reuses its key, so an earlier timed-out attempt and the retry that
 * followed it describe one order and must not render as two.
 */
function latestSubmissions(
  submissions: ReadonlyArray<ManualOrderSubmission>
): ManualOrderSubmission[] {
  const latest = new Map<string, ManualOrderSubmission>()
  for (const submission of submissions) {
    if (!submission.idempotencyKey || !submission.payload) continue
    const current = latest.get(submission.idempotencyKey)
    if (!current || current.submittedAt <= submission.submittedAt) {
      latest.set(submission.idempotencyKey, submission)
    }
  }
  return [...latest.values()]
}

/** A new order the server accepted — not a failure, not a duplicate replay. */
function isAccepted(
  submission: ManualOrderSubmission
): submission is ManualOrderSubmission & {
  response: ManualOrderCreateResponse
} {
  return (
    submission.status === 'success' &&
    submission.response !== undefined &&
    !submission.response.duplicate
  )
}

function isWithinWindow(submission: ManualOrderSubmission, now: number) {
  return now - submission.submittedAt <= RECONCILE_TTL_MS
}

/**
 * Orders the views may still need to account for, newest first.
 *
 * Failed submissions drop out on their own — the dialog reports the error —
 * and a duplicate acceptance is an order the server already lists.
 */
export function selectPendingManualOrders(
  submissions: ReadonlyArray<ManualOrderSubmission>,
  tracking: OrderTracking,
  now: number
): PendingManualOrder[] {
  const pending: PendingManualOrder[] = []

  for (const submission of latestSubmissions(submissions)) {
    if (!isWithinWindow(submission, now)) continue
    const { idempotencyKey, payload, submittedAt } = submission
    if (!idempotencyKey || !payload) continue

    if (submission.status === 'pending') {
      pending.push({
        idempotencyKey,
        payload,
        submittedAt,
        phase: 'submitting',
        orderId: null,
        seenAt: null,
      })
    } else if (isAccepted(submission)) {
      const orderId = submission.response.orderId
      pending.push({
        idempotencyKey,
        payload,
        submittedAt,
        phase: 'queued',
        orderId,
        seenAt: tracking[orderId]?.seenAt ?? null,
      })
    }
  }

  return pending.sort((a, b) => b.submittedAt - a.submittedAt)
}

/** Accepted orders inside the window, whatever has been observed of them. */
export function selectAcceptedOrderIds(
  submissions: ReadonlyArray<ManualOrderSubmission>,
  now: number
): string[] {
  return latestSubmissions(submissions)
    .filter((submission) => isWithinWindow(submission, now))
    .filter(isAccepted)
    .map((submission) => submission.response.orderId)
}

/** Whether any of these orders still has a server step left to observe. */
export function hasUnobservedSteps(
  orderIds: ReadonlyArray<string>,
  tracking: OrderTracking
): boolean {
  return orderIds.some((orderId) => tracking[orderId]?.dispatchedAt == null)
}

/** Accepted orders whose window closed before their verification appeared. */
export function selectExpiredOrderIds(
  submissions: ReadonlyArray<ManualOrderSubmission>,
  tracking: OrderTracking,
  now: number
): string[] {
  return latestSubmissions(submissions)
    .filter((submission) => !isWithinWindow(submission, now))
    .filter(isAccepted)
    .map((submission) => submission.response.orderId)
    .filter((orderId) => !tracking[orderId])
}

/** When the next live submission leaves the window, if one is inside it. */
export function nextExpiryAt(
  submissions: ReadonlyArray<ManualOrderSubmission>,
  now: number
): number | null {
  let next: number | null = null
  for (const submission of latestSubmissions(submissions)) {
    const expiresAt = submission.submittedAt + RECONCILE_TTL_MS
    if (expiresAt < now) continue
    const live = submission.status === 'pending' || isAccepted(submission)
    if (live && (next === null || expiresAt < next)) next = expiresAt
  }
  return next
}
