export type ApprovalReason =
  | 'create_source'
  | 'activate_source'
  | 'already_approved'
  | 'organization_missing'
  | 'native_source'
  | 'native_billing_history'
  | 'owner_missing'
  | 'multiple_owners'
  | 'multiple_owned_organizations'
  | 'source_conflict'
  | 'source_inactive'
  | 'billing_conflict'
  | 'accounting_anchor_missing'
  | 'account_missing'
  | 'account_suspended'

export type ApprovalStatus =
  | 'eligible'
  | 'already_approved'
  | 'skipped'
  | 'ambiguous'

export type CreditAccountStatus = 'pending_approval' | 'active' | 'suspended'

export interface ApprovalRow {
  orgId: string
  organizationName: string | null
  status: ApprovalStatus
  reason: ApprovalReason
  existingSource: boolean
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
    approvedAt: string | null
  } | null
  freeGrantPresent: boolean
  proposed: {
    createSource: boolean
    freeGrantQuantity: number
    accountStatus: 'active'
    billingActivatedAt: string | null
  } | null
}
export interface ApprovalCounts {
  eligible: number
  alreadyApproved: number
  skipped: number
  existingSource: number
  ambiguous: number
}
export type BalanceState = 'none' | 'ok' | 'low' | 'zero' | 'debt'

/** Billing state the staff list shows beside each approval row. */
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
  approval: '' | ApprovalStatus
  accountStatus: '' | CreditAccountStatus
  balance: '' | 'low' | 'zero' | 'debt'
  reconciliation: '' | 'required'
}

export interface CreditAccountRow extends ApprovalRow {
  billing: AccountBillingSummary | null
}

export interface CreditAccountList {
  rows: CreditAccountRow[]
  counts: ApprovalCounts
  nextCursor: string | null
  approvalEnabled: boolean
  lowBalanceThreshold: number
  operations: OperationsAccess
}
export interface ApprovalPreview {
  previewId: string
  evaluatedAt: string
  rows: ApprovalRow[]
  counts: ApprovalCounts
  approvalEnabled: boolean
}
export interface ApprovalApplyReport {
  previewId: string
  completedAt: string
  results: {
    orgId: string
    outcome:
      | 'approved'
      | 'already_applied'
      | 'unchanged'
      | 'skipped'
      | 'changed'
      | 'failed'
    reason: ApprovalReason | 'preview_changed' | 'approval_failed'
    integrationId?: string
    auditId?: string
    grantedCredits?: number
  }[]
}
