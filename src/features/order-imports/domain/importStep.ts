import type {
  OrderImportBatchDetail,
  OrderImportBatchStatus,
} from '../api/orderImportsApi'

/** What the import modal renders for the batch as the server reports it. */
export type BatchView =
  | { kind: 'step'; step: 'map' | 'review' }
  | { kind: 'committing' }
  | { kind: 'imported' }
  | { kind: 'partial' }
  | { kind: 'release' }
  | { kind: 'notStarted' }
  | { kind: 'expired' }
  | { kind: 'unavailable'; status: OrderImportBatchStatus }

/**
 * The step comes from the server's status, never from client memory, so a
 * refresh or a shared link lands on the same screen. A draft is mapped until
 * the merchant confirms the mapping, then reviewed; once committed it shows
 * progress, then the imported summary, then the paced release (US-04.6-07).
 */
export function viewForBatch(
  detail: Pick<OrderImportBatchDetail, 'status' | 'mappingConfirmed'>
): BatchView {
  if (detail.status === 'expired') return { kind: 'expired' }
  if (detail.status === 'committing') return { kind: 'committing' }
  if (detail.status === 'awaiting_start') return { kind: 'imported' }
  // A commit that ran out of retries: some rows are in, the rest are not.
  if (detail.status === 'failed') return { kind: 'partial' }
  if (releaseStatuses.has(detail.status)) return { kind: 'release' }
  if (detail.status === 'not_started') return { kind: 'notStarted' }
  if (detail.status !== 'draft')
    return { kind: 'unavailable', status: detail.status }
  return { kind: 'step', step: detail.mappingConfirmed ? 'review' : 'map' }
}

/** A started batch: its release panel shows progress, pauses and the end. */
const releaseStatuses: ReadonlySet<OrderImportBatchStatus> = new Set([
  'releasing',
  'paused',
  'stopped',
  'completed',
])

/** The modal's three steps: الملف · الفحص · الإرسال. */
export const modalSteps = ['file', 'check', 'send'] as const
export type ModalStep = (typeof modalSteps)[number]

/**
 * Which modal step a batch view belongs to. Mapping is the check; from the
 * review on, everything leads to sending. States outside the flow (expired,
 * not found) show no current step.
 */
export function modalStepFor(
  view: BatchView | { kind: 'new' },
  editingMapping = false
): ModalStep | null {
  switch (view.kind) {
    case 'new':
      return 'file'
    case 'step':
      return view.step === 'map' || editingMapping ? 'check' : 'send'
    case 'committing':
    case 'imported':
    case 'partial':
    case 'release':
      return 'send'
    default:
      return null
  }
}

export function completedModalStepsBefore(
  step: ModalStep | null
): Set<ModalStep> {
  return step === null
    ? new Set()
    : new Set(modalSteps.slice(0, modalSteps.indexOf(step)))
}

export const BATCH_POLL_INTERVAL_MS = 2_000
/** M8: the release panels refresh their live counts every 5 seconds. */
export const RELEASE_POLL_INTERVAL_MS = 5_000

/**
 * Only what the server moves on its own is polled: a commit in progress, and
 * a started batch whose orders are still being sent, confirmed or canceled.
 * A draft or an unstarted import waits for the merchant.
 */
export function pollIntervalFor(
  detail: Pick<OrderImportBatchDetail, 'status' | 'lifecycle'>
): number | false {
  const { status } = detail
  if (status === 'committing') return BATCH_POLL_INTERVAL_MS
  if (status === 'releasing' || status === 'paused' || status === 'stopped')
    return RELEASE_POLL_INTERVAL_MS
  // `completed` means every order was handed to the send queue, not sent.
  if (status === 'completed' && (detail.lifecycle?.queued ?? 0) > 0)
    return RELEASE_POLL_INTERVAL_MS
  return false
}
