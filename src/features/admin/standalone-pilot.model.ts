export type PilotReason =
  | 'create_source'
  | 'activate_source'
  | 'already_entitled'
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

export interface PilotRow {
  orgId: string
  organizationName: string | null
  status: 'eligible' | 'already_entitled' | 'skipped' | 'ambiguous'
  reason: PilotReason
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
  proposed: {
    createSource: boolean
    planId: string
    billingStatus: 'not_required'
    includedLimit: number
    billingActivatedAt: string | null
  } | null
}
export interface PilotCounts {
  eligible: number
  alreadyEntitled: number
  skipped: number
  existingSource: number
  ambiguous: number
}
export interface PilotList {
  rows: PilotRow[]
  counts: PilotCounts
  nextCursor: string | null
  activationEnabled: boolean
}
export interface PilotPreview {
  previewId: string
  evaluatedAt: string
  rows: PilotRow[]
  counts: PilotCounts
  activationEnabled: boolean
}
export interface PilotApplyReport {
  previewId: string
  completedAt: string
  results: {
    orgId: string
    outcome:
      | 'activated'
      | 'already_applied'
      | 'unchanged'
      | 'skipped'
      | 'changed'
      | 'failed'
    reason:
      | PilotReason
      | 'preview_changed'
      | 'activation_failed'
      | 'already_applied'
    integrationId?: string
    auditId?: string
  }[]
}
