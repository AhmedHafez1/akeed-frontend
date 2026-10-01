import type { PurchaseDetail, PurchaseStatus } from './billing.types'

export type ReturnState =
  | { kind: 'invalid' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'stale'; purchase: PurchaseDetail }
  | { kind: 'purchase'; purchase: PurchaseDetail }

export type SettledReturnState = Exclude<ReturnState, { kind: 'loading' }>

/** What the status disc shows; `review` and `problem` are the warning looks. */
export type ReturnLook =
  | 'success'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'canceled'
  | 'refunded'
  | 'review'
  | 'problem'

/** The title and body to read: `billing.return.title.*` / `body.*`. */
export type ReturnCopy =
  | 'successful'
  | 'pending'
  | 'stale'
  | 'failed'
  | 'canceled'
  | 'expired'
  | 'refunded'
  | 'reconciliation'
  | 'invalid'
  | 'error'

export type ReturnPrimary = 'continueImport' | 'refresh' | 'newPurchase'

export type ReturnView = {
  look: ReturnLook
  /** The view's one primary action, when it has one. */
  primary: ReturnPrimary | null
} & (
  | { copy: 'successful'; purchase: PurchaseDetail }
  | {
      copy: Exclude<ReturnCopy, 'successful'>
      purchase: PurchaseDetail | null
    }
)

const LOOK_BY_STATUS: Record<PurchaseStatus, ReturnLook> = {
  successful: 'success',
  pending: 'pending',
  failed: 'failed',
  expired: 'expired',
  canceled: 'canceled',
  refunded: 'refunded',
}

function primaryFor(
  purchase: PurchaseDetail,
  hasReturnTo: boolean
): ReturnPrimary | null {
  if (purchase.status === 'successful')
    return hasReturnTo ? 'continueImport' : null
  if (purchase.status === 'pending') return 'refresh'
  // A payment under review is not ours to retry; support settles it.
  if (purchase.reconciliationRequired) return null
  if (
    purchase.status === 'failed' ||
    purchase.status === 'expired' ||
    purchase.status === 'canceled'
  )
    return 'newPurchase'
  return null
}

/**
 * What the return page shows for a settled read: the look, the copy and the
 * single primary action. `hasReturnTo` is whether another screen (a bulk
 * import short of credits) is waiting for the merchant to come back.
 */
export function resolveReturnView(
  state: SettledReturnState,
  hasReturnTo: boolean
): ReturnView {
  if (state.kind === 'invalid')
    return { look: 'problem', copy: 'invalid', primary: null, purchase: null }
  if (state.kind === 'error')
    return {
      look: 'problem',
      copy: 'error',
      primary: 'refresh',
      purchase: null,
    }

  const { purchase } = state
  const primary = primaryFor(purchase, hasReturnTo)

  if (state.kind === 'stale')
    return { look: 'pending', copy: 'stale', primary, purchase }
  if (purchase.reconciliationRequired)
    return { look: 'review', copy: 'reconciliation', primary, purchase }
  if (purchase.status === 'successful')
    return { look: 'success', copy: 'successful', primary, purchase }
  return {
    look: LOOK_BY_STATUS[purchase.status],
    copy: purchase.status,
    primary,
    purchase,
  }
}
