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

export interface AdjustmentPreview {
  previewId: string
  fingerprint: string
  orgId: string
  quantity: number
  evaluatedAt: string
  before: BalanceProjection
  after: BalanceProjection
}

export interface AdjustmentResult {
  outcome: 'applied' | 'duplicate'
  ledgerEntryId: string
  quantity: number
  before: BalanceProjection
  after: BalanceProjection
  appliedAt: string | null
}

export interface RepairPreview {
  outcome: 'repairable' | 'already_consistent' | 'contradictory'
  previewId: string | null
  fingerprint: string | null
  evaluatedAt: string
  reconciliation: ReconciliationReport
  ledgerEntries: number
  before: BalanceProjection
  after: BalanceProjection
}

export interface RepairResult {
  outcome: 'repaired' | 'already_applied'
  before: BalanceProjection
  after: BalanceProjection
}

export type DispatchResolutionChoice = 'accepted' | 'not_accepted'

export interface DispatchResolutionResult {
  outcome: 'accepted' | 'rejected'
  dispatchId: string
  duplicate: boolean
}

export interface InquiryResult {
  outcome: 'resolved' | 'expired' | 'deferred' | 'not_eligible' | 'not_due'
  reference: string
  ingest: { outcome: string; resultCode: string; errorCode?: string } | null
  purchase: {
    status: PurchaseStatus
    reconciliationRequired: boolean
    reconciliationCode: string | null
    reconciliationAttempts: number
    nextReconciliationAt: string | null
  } | null
}

export const PROVIDER_ACTIONS = [
  'refund',
  'chargeback_open',
  'chargeback_lost',
  'chargeback_won',
] as const
export type ProviderAction = (typeof PROVIDER_ACTIONS)[number]

export interface ProviderActionResult {
  outcome:
    | 'duplicate'
    | 'no_change'
    | 'transitioned'
    | 'reversed'
    | 'quarantined'
  reference: string
  errorCode?: string
  reconciliationCode?: string | null
  reversal?: { type: LedgerType; quantity: number } | null
}
