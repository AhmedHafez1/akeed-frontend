import type {
  OrderImportBatchDetail,
  OrderImportBatchStatus,
} from '../api/orderImportsApi'

export const importSteps = ['upload', 'map', 'review'] as const
export type ImportStep = (typeof importSteps)[number]

/** What the batch page renders for the batch as the server reports it. */
export type BatchView =
  | { kind: 'step'; step: Exclude<ImportStep, 'upload'> }
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

export const BATCH_POLL_INTERVAL_MS = 2_000
/** M8: the release panels refresh their live counts every 5 seconds. */
export const RELEASE_POLL_INTERVAL_MS = 5_000

/**
 * Only what the server moves on its own is polled: a commit in progress, and
 * a started batch whose orders are still being sent, confirmed or canceled.
 * A draft or an unstarted import waits for the merchant.
 */
export function pollIntervalFor(
  status: OrderImportBatchStatus
): number | false {
  if (status === 'committing') return BATCH_POLL_INTERVAL_MS
  if (status === 'releasing' || status === 'paused' || status === 'stopped')
    return RELEASE_POLL_INTERVAL_MS
  return false
}

export function completedStepsBefore(step: ImportStep): Set<ImportStep> {
  return new Set(importSteps.slice(0, importSteps.indexOf(step)))
}
