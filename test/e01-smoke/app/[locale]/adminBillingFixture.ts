import type {
  AccountBillingSummary,
  ApprovalApplyReport,
  ApprovalPreview,
  ApprovalRow,
  CreditAccountList,
  CreditAccountRow,
} from '@/features/admin/standalone-billing.model'
import {
  accountDetailFixture,
  accountOperationFixture,
} from './adminBillingAccountFixture'
import type {
  BillingFinding,
  BillingFindingsPage,
  BillingHealth,
  BillingSettlement,
  BillingSettlementsPage,
} from '@/features/admin/billing-observability.model'

/**
 * `?billing=` on the page selects the observability state: `attention`
 * (default), `healthy`, `critical`, `covered` (complete settlement coverage),
 * `empty` (no findings), `error` (health unavailable), `readonly` (staff
 * without the named-operator role) or `flaky` (the first settlement response
 * is lost).
 */
type ObservabilityScenario =
  | 'attention'
  | 'healthy'
  | 'critical'
  | 'covered'
  | 'empty'
  | 'error'
  | 'readonly'
  | 'flaky'

function observabilityScenario(): ObservabilityScenario {
  if (typeof window === 'undefined') return 'attention'
  const value = new URLSearchParams(window.location.search).get('billing')
  return value === 'healthy' ||
    value === 'critical' ||
    value === 'covered' ||
    value === 'empty' ||
    value === 'error' ||
    value === 'readonly' ||
    value === 'flaky'
    ? value
    : 'attention'
}

/** Every observability request, for the browser check to assert against. */
const observabilityRequests: Array<{
  method: string
  url: string
  idempotencyKey: string | null
  body: string | null
}> = []
;(
  globalThis as typeof globalThis & {
    __akeedBillingObservabilityRequests?: typeof observabilityRequests
  }
).__akeedBillingObservabilityRequests = observabilityRequests

const settlements: BillingSettlement[] = []
const settlementKeys = new Map<string, BillingSettlement>()
let flakyFailed = false

const findingRows: BillingFinding[] = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    code: 'credit_debt',
    severity: 'attention',
    status: 'open',
    orgId: '10000000-0000-4000-8000-000000000005',
    purchaseId: null,
    settlementId: null,
    retryCount: 0,
    nextAction: 'resolve_debt',
    firstSeenAt: '2026-09-09T20:00:00Z',
    lastSeenAt: '2026-09-10T00:00:00Z',
    nextAttemptAt: null,
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    code: 'projection_mismatch',
    severity: 'critical',
    status: 'open',
    orgId: '10000000-0000-4000-8000-000000000003',
    purchaseId: null,
    settlementId: null,
    retryCount: 0,
    nextAction: 'repair_projection',
    firstSeenAt: '2026-09-09T21:00:00Z',
    lastSeenAt: '2026-09-10T00:00:00Z',
    nextAttemptAt: null,
  },
  {
    id: '50000000-0000-4000-8000-000000000003',
    code: 'provider_inquiry_deferred',
    severity: 'attention',
    status: 'open',
    orgId: '10000000-0000-4000-8000-000000000005',
    purchaseId: '80000000-0000-4000-8000-000000000001',
    settlementId: null,
    retryCount: 2,
    nextAction: 'retry_provider_inquiry',
    firstSeenAt: '2026-09-09T22:00:00Z',
    lastSeenAt: '2026-09-10T00:00:00Z',
    nextAttemptAt: '2026-09-10T00:30:00Z',
  },
  {
    id: '50000000-0000-4000-8000-000000000004',
    code: 'settlement_difference',
    severity: 'attention',
    status: 'resolved',
    orgId: null,
    purchaseId: null,
    settlementId: '60000000-0000-4000-8000-000000000099',
    retryCount: 0,
    nextAction: 'review_settlement',
    firstSeenAt: '2026-09-08T08:00:00Z',
    lastSeenAt: '2026-09-08T09:00:00Z',
    nextAttemptAt: null,
  },
]

const FREE_GRANT = 30
const ids = {
  create: '10000000-0000-4000-8000-000000000001',
  activate: '10000000-0000-4000-8000-000000000002',
  approved: '10000000-0000-4000-8000-000000000003',
  review: '10000000-0000-4000-8000-000000000004',
  debt: '10000000-0000-4000-8000-000000000005',
}
const LOW_BALANCE_THRESHOLD = 10
const pendingAccount = {
  status: 'pending_approval' as const,
  postedBalance: 0,
  heldCredits: 0,
  availableCredits: 0,
  version: 0,
  approvedAt: null,
}
const rows: ApprovalRow[] = [
  {
    orgId: ids.create,
    organizationName: 'Source-free merchant',
    status: 'eligible',
    reason: 'create_source',
    existingSource: false,
    source: null,
    account: pendingAccount,
    freeGrantPresent: false,
    proposed: {
      createSource: true,
      freeGrantQuantity: FREE_GRANT,
      accountStatus: 'active',
      billingActivatedAt: null,
    },
  },
  {
    orgId: ids.activate,
    organizationName: 'Existing Standalone source',
    status: 'eligible',
    reason: 'activate_source',
    existingSource: true,
    source: {
      id: '20000000-0000-4000-8000-000000000002',
      identity: `standalone:${ids.activate}`,
      platformType: 'standalone',
      isActive: true,
      billingPlanId: null,
      billingStatus: null,
      billingActivatedAt: null,
    },
    account: pendingAccount,
    freeGrantPresent: false,
    proposed: {
      createSource: false,
      freeGrantQuantity: FREE_GRANT,
      accountStatus: 'active',
      billingActivatedAt: null,
    },
  },
  {
    orgId: ids.approved,
    organizationName: 'Already approved merchant',
    status: 'already_approved',
    reason: 'already_approved',
    existingSource: true,
    source: {
      id: '20000000-0000-4000-8000-000000000003',
      identity: `standalone:${ids.approved}`,
      platformType: 'standalone',
      isActive: true,
      billingPlanId: 'starter',
      billingStatus: 'not_required',
      billingActivatedAt: '2026-08-01T00:00:00Z',
    },
    account: {
      status: 'active',
      postedBalance: FREE_GRANT,
      heldCredits: 1,
      availableCredits: FREE_GRANT - 1,
      version: 1,
      approvedAt: '2026-08-02T09:00:00Z',
    },
    freeGrantPresent: true,
    proposed: null,
  },
  {
    orgId: ids.review,
    organizationName: 'Ambiguous ownership',
    status: 'ambiguous',
    reason: 'multiple_owners',
    existingSource: false,
    source: null,
    account: pendingAccount,
    freeGrantPresent: false,
    proposed: null,
  },
  {
    orgId: ids.debt,
    organizationName: 'Refunded merchant in debt',
    status: 'already_approved',
    reason: 'already_approved',
    existingSource: true,
    source: {
      id: '20000000-0000-4000-8000-000000000005',
      identity: `standalone:${ids.debt}`,
      platformType: 'standalone',
      isActive: true,
      billingPlanId: 'starter',
      billingStatus: 'not_required',
      billingActivatedAt: '2026-08-01T00:00:00Z',
    },
    account: {
      status: 'active',
      postedBalance: -12,
      heldCredits: 1,
      availableCredits: 0,
      version: 9,
      approvedAt: '2026-08-02T09:00:00Z',
    },
    freeGrantPresent: true,
    proposed: null,
  },
]
let applyCalls = 0

/** The same balance rules the backend applies, for synthetic rows. */
function billingSummary(row: ApprovalRow): AccountBillingSummary | null {
  const account = row.account
  if (!account) return null
  const available = Math.max(account.postedBalance - account.heldCredits, 0)
  const balanceState =
    account.status === 'pending_approval'
      ? 'none'
      : account.postedBalance < 0
        ? 'debt'
        : available === 0
          ? 'zero'
          : available <= LOW_BALANCE_THRESHOLD
            ? 'low'
            : 'ok'
  const flagged = row.orgId === ids.debt
  return {
    debtCredits: Math.max(-account.postedBalance, 0),
    balanceState,
    projectionConsistent: true,
    flaggedPurchases: flagged ? 1 : 0,
    unresolvedHolds: account.heldCredits,
    reconciliationRequired: flagged || account.heldCredits > 0,
  }
}

const accountRows: CreditAccountRow[] = rows.map((row) => ({
  ...row,
  billing: billingSummary(row),
}))

function filterAccounts(query: URLSearchParams) {
  return accountRows.filter((row) => {
    const approval = query.get('approval')
    const accountStatus = query.get('accountStatus')
    const balance = query.get('balance')
    const reconciliation = query.get('reconciliation')
    return (
      (!approval || row.status === approval) &&
      (!accountStatus || row.account?.status === accountStatus) &&
      (!balance || row.billing?.balanceState === balance) &&
      (!reconciliation || !!row.billing?.reconciliationRequired)
    )
  })
}

function counts(selected: ApprovalRow[]) {
  return {
    eligible: selected.filter((row) => row.status === 'eligible').length,
    alreadyApproved: selected.filter((row) => row.status === 'already_approved')
      .length,
    skipped: selected.filter((row) => row.status === 'skipped').length,
    existingSource: selected.filter((row) => row.existingSource).length,
    ambiguous: selected.filter((row) => row.status === 'ambiguous').length,
  }
}

export function resetBillingApprovalFixture() {
  applyCalls = 0
}

export async function adminBillingFixtureRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (url === '/api/admin/session')
    return Response.json({ authenticated: true, role: 'admin' })
  if (url.startsWith('/api/admin/standalone-billing/')) {
    observabilityRequests.push({
      method: options.method ?? 'GET',
      url,
      idempotencyKey:
        (options.headers as Record<string, string> | undefined)?.[
          'Idempotency-Key'
        ] ?? null,
      body: typeof options.body === 'string' ? options.body : null,
    })
  }
  const scenario = observabilityScenario()
  if (url.startsWith('/api/admin/standalone-billing/health?')) {
    if (scenario === 'error')
      return Response.json(
        { message: 'Unavailable', requestId: 'req-fixture-health' },
        { status: 503 }
      )
    const query = new URL(url, 'http://fixture').searchParams
    const healthy = scenario === 'healthy' || scenario === 'covered'
    const covered = scenario === 'covered'
    const response: BillingHealth = {
      evaluatedAt: '2026-09-10T00:00:00Z',
      range: { from: query.get('from'), to: query.get('to') },
      health: {
        status:
          scenario === 'critical'
            ? 'critical'
            : healthy
              ? 'healthy'
              : 'attention',
        latestRun: {
          id: '40000000-0000-4000-8000-000000000001',
          status: 'completed',
          trigger: 'nightly',
          mode: healthy ? 'active' : 'report_only',
          startedAt: '2026-09-10T00:30:00Z',
          completedAt: '2026-09-10T00:31:00Z',
          createdAt: '2026-09-10T00:30:00Z',
        },
        scheduledInquiryEnabled: healthy,
        reportOnly: !healthy,
        cron: '30 2 * * *',
        timezone: 'Africa/Cairo',
        openFindings: healthy ? 0 : 27,
        criticalFindings: scenario === 'critical' ? 1 : 0,
        oldestFindingAgeMinutes: healthy ? 0 : 145,
        backlogAlert: !healthy,
        provider: {
          attempts: 5,
          failures: healthy ? 0 : 1,
          slow: healthy ? 0 : 1,
          averageDurationMs: 1200,
          errorRatePercent: healthy ? 0 : 20,
          degraded: !healthy,
        },
      },
      product: {
        approvedOrganizations: 3,
        lowBalanceOrganizations: 1,
        zeroBalanceOrganizations: 1,
        launchGrants: 3,
        freeCreditsGranted: 90,
        freeUtilizationPercent: 62,
        checkoutStarts: 8,
        successfulPurchases: 5,
        firstPurchases: 3,
        repeatPurchases: 2,
        averagePurchaseCredits: 180,
        paidConversionPercent: 62.5,
        initialConsumption: 40,
        followUpConsumption: 12,
        failureReversals: 3,
      },
      finance: {
        purchasedCredits: 900,
        grossMinor: 180000,
        refundedMinor: 10000,
        chargebackMinor: 0,
        unspentPaidCredits: 410,
        unspentPaidCreditLiabilityMinor: 82000,
        feeMinor: covered ? 4500 : null,
        vatMinor: covered ? 630 : null,
        netRevenueMinor: covered ? 164870 : null,
        payingOrganizations: 3,
        arppuMinor: covered ? 54957 : null,
        revenuePerAcceptedMessageMinor: covered ? 3171 : null,
      },
      settlementCoverage: {
        complete: covered,
        reports: covered ? 1 : 0,
        periodStart: covered ? query.get('from') : null,
        periodEnd: covered ? query.get('to') : null,
      },
    }
    return Response.json(response)
  }
  if (
    url.startsWith('/api/admin/standalone-billing/reconciliation/findings?')
  ) {
    const query = new URL(url, 'http://fixture').searchParams
    const response: BillingFindingsPage = {
      rows:
        scenario === 'empty' || scenario === 'healthy' || scenario === 'covered'
          ? []
          : findingRows.filter(
              (row) =>
                (!query.get('status') || row.status === query.get('status')) &&
                (!query.get('severity') ||
                  row.severity === query.get('severity')) &&
                (!query.get('code') || row.code.includes(query.get('code')!))
            ),
      nextCursor: null,
    }
    return Response.json(response)
  }
  if (
    url === '/api/admin/standalone-billing/reconciliation/runs' &&
    options.method === 'POST'
  )
    return scenario === 'readonly'
      ? Response.json(
          { message: 'Operator required', requestId: 'req-fixture-operator' },
          { status: 403 }
        )
      : Response.json({
          runId: '40000000-0000-4000-8000-000000000002',
          status: 'queued',
          mode: 'report_only',
        })
  if (
    url.startsWith('/api/admin/standalone-billing/settlements?') &&
    options.method === undefined
  ) {
    const response: BillingSettlementsPage = {
      rows: [...settlements].reverse().map((row) => ({
        ...row,
        effective: !settlements.some((other) => other.supersedesId === row.id),
      })),
      nextCursor: null,
    }
    return Response.json(response)
  }
  if (
    url === '/api/admin/standalone-billing/settlements' &&
    options.method === 'POST'
  ) {
    if (scenario === 'readonly')
      return Response.json(
        { message: 'Operator required', requestId: 'req-fixture-operator' },
        { status: 403 }
      )
    const key = (options.headers as Record<string, string>)['Idempotency-Key']
    // `flaky` loses the first response, as a dropped connection would.
    if (scenario === 'flaky' && !flakyFailed) {
      flakyFailed = true
      return Response.json(
        { message: 'Gateway timeout', requestId: 'req-fixture-timeout' },
        { status: 504 }
      )
    }
    const replay = settlementKeys.get(key)
    if (replay) return Response.json({ ...replay, duplicate: true })
    const input = JSON.parse(String(options.body)) as Omit<
      BillingSettlement,
      'id' | 'revision' | 'actorId' | 'createdAt' | 'effective'
    >
    const previous = settlements.find((row) => row.id === input.supersedesId)
    if (
      input.supersedesId &&
      (!previous ||
        settlements.some((row) => row.supersedesId === input.supersedesId))
    )
      return Response.json(
        { message: 'Conflict', code: 'BILLING_SETTLEMENT_CONFLICT' },
        { status: 409 }
      )
    const row: BillingSettlement = {
      ...input,
      id: `60000000-0000-4000-8000-${String(settlements.length + 1).padStart(12, '0')}`,
      revision: previous ? previous.revision + 1 : 1,
      actorId: '70000000-0000-4000-8000-000000000001',
      createdAt: new Date().toISOString(),
      effective: true,
    }
    settlements.push(row)
    settlementKeys.set(key, row)
    return Response.json({ ...row, duplicate: false })
  }
  if (
    url.startsWith('/api/admin/standalone-billing/accounts?') &&
    options.method === undefined
  ) {
    const page = filterAccounts(new URL(url, 'http://fixture').searchParams)
    const response: CreditAccountList = {
      rows: page,
      counts: counts(page),
      nextCursor: null,
      approvalEnabled: true,
      lowBalanceThreshold: LOW_BALANCE_THRESHOLD,
      operations: { enabled: true, operator: scenario !== 'readonly' },
    }
    return Response.json(response)
  }
  const account =
    /^\/api\/admin\/standalone-billing\/accounts\/([0-9a-f-]{36})$/.exec(url)
  if (account && options.method === undefined) {
    const row = rows.find((candidate) => candidate.orgId === account[1])
    if (!row)
      return Response.json(
        {
          message: 'Organization not found.',
          code: 'BILLING_ACCOUNT_NOT_FOUND',
        },
        { status: 404 }
      )
    return Response.json(
      accountDetailFixture(row.orgId, row.organizationName ?? row.orgId)
    )
  }
  const operation = await accountOperationFixture(url, options)
  if (operation) return operation
  if (
    url === '/api/admin/standalone-billing/approvals/preview' &&
    options.method === 'POST'
  ) {
    const input = JSON.parse(String(options.body)) as {
      organizationIds: string[]
    }
    const selected = input.organizationIds
      .map((id) => rows.find((row) => row.orgId === id))
      .filter((row): row is ApprovalRow => !!row)
    const response: ApprovalPreview = {
      previewId: '30000000-0000-4000-8000-000000000001',
      evaluatedAt: '2026-09-03T18:00:00Z',
      rows: selected,
      counts: counts(selected),
      approvalEnabled: true,
    }
    return Response.json(response)
  }
  if (
    url === '/api/admin/standalone-billing/approvals/apply' &&
    options.method === 'POST'
  ) {
    applyCalls++
    const response: ApprovalApplyReport = {
      previewId: '30000000-0000-4000-8000-000000000001',
      completedAt: new Date().toISOString(),
      results:
        applyCalls === 1
          ? [
              {
                orgId: ids.create,
                outcome: 'approved',
                reason: 'create_source',
                grantedCredits: FREE_GRANT,
              },
              {
                orgId: ids.activate,
                outcome: 'failed',
                reason: 'approval_failed',
              },
            ]
          : [
              {
                orgId: ids.create,
                outcome: 'already_applied',
                reason: 'already_approved',
              },
              {
                orgId: ids.activate,
                outcome: 'approved',
                reason: 'activate_source',
                grantedCredits: FREE_GRANT,
              },
            ],
    }
    return Response.json(response)
  }
  throw new Error(
    `Blocked admin billing fixture request: ${options.method} ${url}`
  )
}
