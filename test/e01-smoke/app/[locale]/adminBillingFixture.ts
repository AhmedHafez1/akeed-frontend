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
      operations: { enabled: true, operator: true },
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
