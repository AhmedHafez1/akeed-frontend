export type CreditAccountStatus =
  | 'active'
  | 'not_provisioned'
  | 'pending_approval'
  | 'suspended'

export type PurchaseStatus =
  | 'canceled'
  | 'expired'
  | 'failed'
  | 'pending'
  | 'refunded'
  | 'successful'

export type DisputeStatus = 'lost' | 'none' | 'open' | 'won'

export type LedgerType =
  | 'chargeback_reinstatement'
  | 'chargeback_reversal'
  | 'consumption'
  | 'failure_reversal'
  | 'free_grant'
  | 'purchase'
  | 'refund_reversal'
  | 'staff_adjustment'

export type LedgerActorType = 'akeed_staff' | 'meta' | 'paymob' | 'system'

export type LedgerReasonCode =
  | 'chargeback_reinstated'
  | 'chargeback_reversed'
  | 'delivery_failure_restored'
  | 'launch_grant'
  | 'message_accepted'
  | 'payment_verified'
  | 'refund_reversed'
  | 'staff_adjustment'

export interface CreditSummary {
  billingEnabled: boolean
  status: CreditAccountStatus
  postedBalance: number
  heldCredits: number
  availableCredits: number
  debtCredits: number
  lowBalanceThreshold: number
  freeGrant: {
    granted: boolean
    quantity: number
    grantedAt: string | null
  }
  price: { unitPriceMinor: number; currency: string }
  range: { min: number; max: number; step: number }
  canPurchase: boolean
  purchaseDenialReason: string | null
}

export interface LedgerEntry {
  id: string
  type: LedgerType
  quantity: number
  actorType: LedgerActorType
  reasonCode: LedgerReasonCode
  postedBalanceAfter: number
  createdAt: string
  purchaseRef: string | null
}

export interface PurchaseSummary {
  reference: string
  status: PurchaseStatus
  disputeStatus: DisputeStatus
  quantity: number
  unitPriceMinor: number
  totalMinor: number
  currency: string
  refundedMinor: number
  reconciliationRequired: boolean
  checkoutExpiresAt: string | null
  createdAt: string
  updatedAt: string
}

export type PurchaseDetail = PurchaseSummary

export interface CreatePurchaseResponse extends PurchaseSummary {
  checkoutUrl: string | null
  duplicate: boolean
  code?: string
}

export interface PagedResponse<T> {
  items: T[]
  nextCursor: string | null
  limit: number
}
