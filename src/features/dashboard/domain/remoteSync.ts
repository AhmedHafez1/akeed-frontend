import type { StatusBadgeKind } from '@/shared/ui/status-badge'
import type { VerificationItem } from '../model/dashboard.model'

/**
 * What the dashboard says about the store's side of a result. Keys are
 * relative to `dashboard.table.storeSync`.
 *
 * This is always shown next to the verification status, never instead of it:
 * the status is what the customer or the merchant decided, and this is only
 * whether the store has been told. It is driven by the server's state and
 * codes, so it reads the same for every source that reports one.
 */
export interface RemoteSyncView {
  state: 'pending' | 'succeeded' | 'failed' | 'unsupported'
  badge: StatusBadgeKind
  /** The state in a word or two. */
  labelKey: string
  /** What happened and what the merchant can do; absent when all is well. */
  guidanceKey?: string
  /** A failed update the merchant may ask to be tried again. */
  canRetry: boolean
  /** The short line under the row's status; absent when nothing is owed. */
  rowNoteKey?: string
  updatedAt: string
}

/** Failure codes with their own sentence; anything else gets the general one. */
const FAILURE_GUIDANCE: Record<string, string> = {
  remote_state_conflict: 'guidance.stateConflict',
  order_not_found: 'guidance.orderNotFound',
  source_credentials_rejected: 'guidance.reconnect',
  credentials_unreadable: 'guidance.reconnect',
  connection_missing: 'guidance.reconnect',
  integration_inactive: 'guidance.reconnect',
  source_store_inactive: 'guidance.storeInactive',
  source_permission_denied: 'guidance.permissionDenied',
  store_unreachable: 'guidance.storeUnreachable',
  store_write_method_refused: 'guidance.hostingBlocksUpdates',
}

export function remoteSyncView(
  row: Pick<VerificationItem, 'remote_sync'>
): RemoteSyncView | null {
  const sync = row.remote_sync
  if (!sync) return null
  const base = {
    state: sync.state,
    canRetry: false,
    updatedAt: sync.updated_at,
  }

  switch (sync.state) {
    case 'succeeded':
      return { ...base, badge: 'confirmed', labelKey: 'state.succeeded' }
    case 'pending':
      return {
        ...base,
        badge: 'scheduled',
        labelKey: 'state.pending',
        guidanceKey: 'guidance.pending',
        rowNoteKey: 'row.pending',
      }
    case 'unsupported':
      return {
        ...base,
        badge: 'scheduled',
        labelKey: 'state.unsupported',
        guidanceKey:
          sync.action === 'automatic_no_reply_tagging'
            ? 'guidance.noReplyLocalOnly'
            : 'guidance.notSwitchedOn',
      }
    case 'failed':
      return {
        ...base,
        badge: 'failed',
        labelKey: 'state.failed',
        guidanceKey:
          (sync.error_code && Object.hasOwn(FAILURE_GUIDANCE, sync.error_code)
            ? FAILURE_GUIDANCE[sync.error_code]
            : undefined) ??
          (sync.requires_assistance ? 'guidance.reconnect' : 'guidance.failed'),
        canRetry: sync.retryable,
        rowNoteKey: 'row.failed',
      }
    default:
      return null
  }
}
