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
  | { kind: 'expired' }
  | { kind: 'unavailable'; status: OrderImportBatchStatus }

/**
 * The step comes from the server's status, never from client memory, so a
 * refresh or a shared link lands on the same screen. A draft is mapped until
 * the merchant confirms the mapping, then reviewed; once committed it shows
 * progress, then the imported summary. Release belongs to US-04.6-07.
 */
export function viewForBatch(
  detail: Pick<OrderImportBatchDetail, 'status' | 'mappingConfirmed'>
): BatchView {
  if (detail.status === 'expired') return { kind: 'expired' }
  if (detail.status === 'committing') return { kind: 'committing' }
  if (detail.status === 'awaiting_start') return { kind: 'imported' }
  // A commit that ran out of retries: some rows are in, the rest are not.
  if (detail.status === 'failed') return { kind: 'partial' }
  if (detail.status !== 'draft')
    return { kind: 'unavailable', status: detail.status }
  return { kind: 'step', step: detail.mappingConfirmed ? 'review' : 'map' }
}

/** Statuses the server moves on its own; only these are polled. */
const transitionalStatuses: ReadonlySet<OrderImportBatchStatus> = new Set([
  'committing',
  'releasing',
])

export function isTransitional(status: OrderImportBatchStatus): boolean {
  return transitionalStatuses.has(status)
}

export const BATCH_POLL_INTERVAL_MS = 2_000

export function completedStepsBefore(step: ImportStep): Set<ImportStep> {
  return new Set(importSteps.slice(0, importSteps.indexOf(step)))
}
