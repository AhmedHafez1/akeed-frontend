import type {
  LedgerActorType,
  LedgerEntry,
  LedgerReasonCode,
  LedgerType,
  PurchaseSummary,
} from './billing.types'

export type TransactionKind = 'purchase' | 'usage' | 'adjustment'

export interface Transaction {
  id: string
  kind: TransactionKind
  ledgerType: LedgerType
  reasonCode: LedgerReasonCode
  actorType: LedgerActorType
  /** Signed, exactly as the ledger stores it. */
  quantity: number
  balanceAfter: number
  createdAt: string
  /** The purchase reference when one exists; usage entries carry none. */
  reference: string | null
  purchase: PurchaseSummary | null
}

const KIND_BY_LEDGER_TYPE: Record<LedgerType, TransactionKind> = {
  purchase: 'purchase',
  free_grant: 'purchase',
  consumption: 'usage',
  chargeback_reinstatement: 'adjustment',
  chargeback_reversal: 'adjustment',
  failure_reversal: 'adjustment',
  refund_reversal: 'adjustment',
  staff_adjustment: 'adjustment',
}

/**
 * One ordered stream from the two endpoints the API exposes.
 *
 * The ledger is the spine: it already contains a row for every purchase grant
 * (`type: 'purchase'`, `reasonCode: 'payment_verified'`) carrying the purchase
 * reference, so joining `PurchaseSummary` by reference adds the money and the
 * settlement status without inventing a second ordering.
 */
export function buildTransactions(
  ledger: LedgerEntry[],
  purchases: PurchaseSummary[]
): Transaction[] {
  const byReference = new Map(
    purchases.map((purchase) => [purchase.reference, purchase])
  )

  return ledger
    .map<Transaction>((entry) => ({
      id: entry.id,
      kind: KIND_BY_LEDGER_TYPE[entry.type] ?? 'adjustment',
      ledgerType: entry.type,
      reasonCode: entry.reasonCode,
      actorType: entry.actorType,
      quantity: entry.quantity,
      balanceAfter: entry.postedBalanceAfter,
      createdAt: entry.createdAt,
      reference: entry.purchaseRef,
      purchase: entry.purchaseRef
        ? (byReference.get(entry.purchaseRef) ?? null)
        : null,
    }))
    .sort(compareNewestFirst)
}

/*
 * The id tiebreak is not cosmetic: several ledger rows are written inside one
 * transaction and therefore share a `created_at`. The server pages on
 * `(created_at, id)` for the same reason, and re-sorting without the tiebreak
 * would shuffle those rows relative to the page boundaries they arrived in.
 */
function compareNewestFirst(a: Transaction, b: Transaction) {
  const delta = Date.parse(b.createdAt) - Date.parse(a.createdAt)
  return delta !== 0 ? delta : b.id.localeCompare(a.id)
}

/**
 * Messages spent since the start of the current local month. Only consumption
 * rows count; a reversal or a grant is not usage.
 */
export function usedThisMonth(
  items: Transaction[],
  now: Date = new Date()
): number {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  let used = 0
  for (const item of items) {
    if (
      item.ledgerType === 'consumption' &&
      Date.parse(item.createdAt) >= monthStart
    ) {
      used += Math.abs(item.quantity)
    }
  }
  return used
}

/**
 * True when the loaded rows definitely reach back to `since`, i.e. every
 * entry from then on has been seen: either the feed is exhausted, or its
 * oldest loaded row is older still. Without this check a usage total would
 * silently under-report as soon as the drain stopped short.
 */
export function coversSince(
  items: Transaction[],
  isExhausted: boolean,
  since: number
): boolean {
  if (isExhausted) return true
  const oldest = items.at(-1)
  if (!oldest) return false
  return Date.parse(oldest.createdAt) < since
}
