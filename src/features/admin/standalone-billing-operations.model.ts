import type {
  BalanceState,
  CreditAccountStatus,
  OperationsAccess,
} from './standalone-billing.model'

export interface BalanceProjection {
  postedBalance: number
  heldCredits: number
  availableCredits: number
  debtCredits: number
}

export const CONTRADICTION_CODES = [
  'reservation_held_with_ledger',
  'reservation_held_on_settled_dispatch',
  'reservation_consumed_without_consumption',
  'reservation_consumed_with_reversal',
  'reservation_released_unbalanced',
  'purchase_entry_without_success',
  'purchase_success_without_entry',
  'purchase_reversal_exceeds_grant',
] as const
export type ContradictionCode = (typeof CONTRADICTION_CODES)[number]

export interface Contradiction {
  code: ContradictionCode
  reservationId?: string
  purchaseRef?: string
}

export interface ReconciliationReport {
  postedBalance: number
  heldCredits: number
  ledgerBalance: number
  reservationHolds: number
  postedDifference: number
  heldDifference: number
  consistent: boolean
  contradictions: Contradiction[]
}

export interface DetailPage<T> {
  items: T[]
  truncated: boolean
}

export type LedgerType =
  | 'free_grant'
  | 'purchase'
  | 'consumption'
  | 'failure_reversal'
  | 'refund_reversal'
  | 'chargeback_reversal'
  | 'chargeback_reinstatement'
  | 'staff_adjustment'

export interface LedgerRow {
  id: string
  type: LedgerType
  quantity: number
  reason: string
  actorId: string | null
  purchaseRef: string | null
  dispatchId: string | null
  reservationId: string | null
  sourceLedgerEntryId: string | null
  sourceReference: string | null
  postedBalanceBefore: number
  postedBalanceAfter: number
  createdAt: string
}

export interface HoldRow {
  reservationId: string
  dispatchId: string
  verificationId: string
  kind: 'initial' | 'follow_up'
  generation: number
  quantity: number
  createdAt: string
  dispatchState: string | null
  accountingMode: string | null
  attemptCount: number | null
  lastErrorCode: string | null
  providerMessageIdRecorded: boolean
  leaseUntil: string | null
}

export type PurchaseStatus =
  | 'pending'
  | 'successful'
  | 'failed'
  | 'canceled'
  | 'expired'
  | 'refunded'
export type DisputeStatus = 'none' | 'open' | 'lost' | 'won'

export interface PurchaseRow {
  reference: string
  provider: string
  mode: string
  status: PurchaseStatus
  disputeStatus: DisputeStatus
  quantity: number
  unitPriceMinor: number
  totalMinor: number
  currency: string
  refundedMinor: number
  providerOrderId: string | null
  providerTransactionId: string | null
  checkoutExpiresAt: string | null
  reconciliationRequired: boolean
  reconciliationCode: string | null
  reconciliationAttempts: number
  nextReconciliationAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProviderEventRow {
  id: string
  provider: string
  purchaseRef: string | null
  verified: boolean
  resultCode: string
  errorCode: string | null
  receivedAt: string
  processedAt: string | null
}

export interface AuditRow {
  id: string
  action: string
  outcome: string
  actorId: string | null
  requestId: string | null
  createdAt: string | null
  summary: Record<string, string | number | boolean | null>
}

export interface AccountDetail {
  organization: { id: string; name: string } | null
  account:
    | (BalanceProjection & {
        status: CreditAccountStatus
        balanceState: BalanceState
        version: number
        approvedAt: string | null
        updatedAt: string
      })
    | null
  lowBalanceThreshold: number
  reconciliation: ReconciliationReport | null
  mutationsBlocked: boolean
  operations: OperationsAccess
  ledger: DetailPage<LedgerRow>
  holds: DetailPage<HoldRow>
  purchases: DetailPage<PurchaseRow>
  events: DetailPage<ProviderEventRow>
  audit: DetailPage<AuditRow>
}
