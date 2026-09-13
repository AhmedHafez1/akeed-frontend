export type CreditAccountStatus = 'active' | 'suspended'

export type BalanceState = 'none' | 'ok' | 'low' | 'zero' | 'debt'

/** Billing state the staff list shows beside each account row. */
export interface AccountBillingSummary {
  debtCredits: number
  balanceState: BalanceState
  projectionConsistent: boolean
  flaggedPurchases: number
  unresolvedHolds: number
  reconciliationRequired: boolean
}

export interface OperationsAccess {
  enabled: boolean
  operator: boolean
}

export interface AccountFilters {
  accountStatus: '' | CreditAccountStatus
  balance: '' | 'low' | 'zero' | 'debt'
  reconciliation: '' | 'required'
}

export interface CreditAccountRow {
  orgId: string
  organizationName: string | null
  source: {
    id: string
    identity: string
    platformType: string
    isActive: boolean | null
    billingPlanId: string | null
    billingStatus: string | null
    billingActivatedAt: string | null
  } | null
  account: {
    status: CreditAccountStatus
    postedBalance: number
    heldCredits: number
    availableCredits: number
    version: number
  } | null
  freeGrantPresent: boolean
  billing: AccountBillingSummary | null
}

export interface CreditAccountList {
  rows: CreditAccountRow[]
  nextCursor: string | null
  lowBalanceThreshold: number
  operations: OperationsAccess
}
