import type {
  OrderImportBatchDetail,
  OrderImportStartedBatch,
} from '../api/orderImportsApi'
import { isSettling, releaseProgress } from './releaseSummary'

/** What the top bar says about a started import. */
export type ImportProgressChip =
  | { kind: 'sending'; settled: number; total: number }
  | { kind: 'paused'; settled: number; total: number }
  | { kind: 'done'; delivered: number; failed: number; total: number }

/**
 * The import the top bar follows: one still sending (or paused) before one
 * that finished, the newest first, as the server lists them.
 */
export function followedImport(
  batches: readonly OrderImportStartedBatch[]
): OrderImportStartedBatch | null {
  return (
    batches.find(
      (batch) => batch.status === 'releasing' || batch.status === 'paused'
    ) ??
    batches[0] ??
    null
  )
}

/**
 * The chip for one import, from the same lifecycle counts the confirmations
 * list shows (so the two never disagree). `done` only once every send has an
 * outcome: a batch reads `completed` while its last sends are still settling.
 */
export function importProgressChip(
  detail: Pick<OrderImportBatchDetail, 'status' | 'lifecycle' | 'release'>
): ImportProgressChip | null {
  const progress = releaseProgress(detail)
  if (detail.status === 'paused')
    return {
      kind: 'paused',
      settled: progress.settled,
      total: progress.total,
    }
  if (detail.status === 'releasing' || isSettling(detail))
    return {
      kind: 'sending',
      settled: progress.settled,
      total: progress.total,
    }
  if (detail.status === 'completed' || detail.status === 'stopped')
    return {
      kind: 'done',
      delivered: progress.delivered,
      failed: progress.failed,
      total: progress.total,
    }
  return null
}
