import type {
  ApprovalApplyReport,
  ApprovalPreview,
  ApprovalRow,
  CreditAccountList,
} from '@/features/admin/standalone-billing.model'

const FREE_GRANT = 30
const ids = {
  create: '10000000-0000-4000-8000-000000000001',
  activate: '10000000-0000-4000-8000-000000000002',
  approved: '10000000-0000-4000-8000-000000000003',
  review: '10000000-0000-4000-8000-000000000004',
}
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
]
let applyCalls = 0

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
    const response: CreditAccountList = {
      rows,
      counts: counts(rows),
      nextCursor: null,
      approvalEnabled: true,
    }
    return Response.json(response)
  }
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
