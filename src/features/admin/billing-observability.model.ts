export type BillingHealthStatus = 'healthy' | 'attention' | 'critical'
export type BillingFindingSeverity = 'attention' | 'critical'
export type BillingFindingStatus = 'open' | 'resolved'

export interface BillingRunSummary {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  trigger: 'nightly' | 'manual' | 'settlement'
  mode: 'report_only' | 'active' | 'local_only'
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface BillingHealth {
  evaluatedAt: string
  range: { from: string | null; to: string | null }
  health: {
    status: BillingHealthStatus
    latestRun: BillingRunSummary | null
    scheduledInquiryEnabled: boolean
    reportOnly: boolean
    cron: string
    timezone: string
    openFindings: number
    criticalFindings: number
    oldestFindingAgeMinutes: number
    backlogAlert: boolean
    provider: {
      attempts: number
      failures: number
      slow: number
      averageDurationMs: number
      errorRatePercent: number
      degraded: boolean
    }
  }
  product: {
    approvedOrganizations: number
    lowBalanceOrganizations: number
    zeroBalanceOrganizations: number
    launchGrants: number
    freeCreditsGranted: number
    freeUtilizationPercent: number
    checkoutStarts: number
    successfulPurchases: number
    firstPurchases: number
    repeatPurchases: number
    averagePurchaseCredits: number
    paidConversionPercent: number
    initialConsumption: number
    followUpConsumption: number
    failureReversals: number
  }
  finance: {
    purchasedCredits: number
    grossMinor: number
    refundedMinor: number
    chargebackMinor: number
    unspentPaidCredits: number
    unspentPaidCreditLiabilityMinor: number
    feeMinor: number | null
    vatMinor: number | null
    netRevenueMinor: number | null
    payingOrganizations: number
    arppuMinor: number | null
    revenuePerAcceptedMessageMinor: number | null
  }
  settlementCoverage: {
    complete: boolean
    reports: number
    periodStart: string | null
    periodEnd: string | null
  }
}

export interface BillingFinding {
  id: string
  code: string
  severity: BillingFindingSeverity
  status: BillingFindingStatus
  orgId: string | null
  purchaseId: string | null
  settlementId: string | null
  retryCount: number
  nextAction: string
  firstSeenAt: string
  lastSeenAt: string
  nextAttemptAt: string | null
}

export interface BillingFindingsPage {
  rows: BillingFinding[]
  nextCursor: string | null
}

export interface BillingSettlement {
  id: string
  providerReportId: string
  revision: number
  supersedesId: string | null
  periodStart: string
  periodEnd: string
  settledAt: string
  currency: string
  transactionCount: number
  grossMinor: number
  refundedMinor: number
  chargebackMinor: number
  feeMinor: number
  vatMinor: number
  netMinor: number
  actorId: string
  evidence: string
  reason: string
  createdAt: string
  effective: boolean
}

export interface BillingSettlementsPage {
  rows: BillingSettlement[]
  nextCursor: string | null
}

export interface BillingFindingFilters {
  status: '' | BillingFindingStatus
  severity: '' | BillingFindingSeverity
  code: string
}
