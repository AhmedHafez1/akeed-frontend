import type {
  PilotApplyReport,
  PilotList,
  PilotPreview,
  PilotRow,
} from '@/features/admin/standalone-pilot.model'

const ids = {
  create: '10000000-0000-4000-8000-000000000001',
  activate: '10000000-0000-4000-8000-000000000002',
  entitled: '10000000-0000-4000-8000-000000000003',
  review: '10000000-0000-4000-8000-000000000004',
}
const rows: PilotRow[] = [
  {
    orgId: ids.create,
    organizationName: 'Source-free pilot',
    status: 'eligible',
    reason: 'create_source',
    existingSource: false,
    source: null,
    proposed: {
      createSource: true,
      planId: 'starter',
      billingStatus: 'not_required',
      includedLimit: 30,
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
    proposed: {
      createSource: false,
      planId: 'starter',
      billingStatus: 'not_required',
      includedLimit: 30,
      billingActivatedAt: null,
    },
  },
  {
    orgId: ids.entitled,
    organizationName: 'Existing manual pilot',
    status: 'already_entitled',
    reason: 'already_entitled',
    existingSource: true,
    source: {
      id: '20000000-0000-4000-8000-000000000003',
      identity: `standalone:${ids.entitled}`,
      platformType: 'standalone',
      isActive: true,
      billingPlanId: 'starter',
      billingStatus: 'not_required',
      billingActivatedAt: '2026-08-01T00:00:00Z',
    },
    proposed: null,
  },
  {
    orgId: ids.review,
    organizationName: 'Ambiguous ownership',
    status: 'ambiguous',
    reason: 'multiple_owners',
    existingSource: false,
    source: null,
    proposed: null,
  },
]
let applyCalls = 0

function counts(selected: PilotRow[]) {
  return {
    eligible: selected.filter((row) => row.status === 'eligible').length,
    alreadyEntitled: selected.filter((row) => row.status === 'already_entitled')
      .length,
    skipped: selected.filter((row) => row.status === 'skipped').length,
    existingSource: selected.filter((row) => row.existingSource).length,
    ambiguous: selected.filter((row) => row.status === 'ambiguous').length,
  }
}

export function resetPilotFixture() {
  applyCalls = 0
}

export async function adminPilotFixtureRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (url === '/api/admin/session')
    return Response.json({ authenticated: true, role: 'admin' })
  if (
    url.startsWith('/api/admin/standalone-pilots?') &&
    options.method === undefined
  ) {
    const response: PilotList = {
      rows,
      counts: counts(rows),
      nextCursor: null,
      activationEnabled: true,
    }
    return Response.json(response)
  }
  if (
    url === '/api/admin/standalone-pilots/preview' &&
    options.method === 'POST'
  ) {
    const input = JSON.parse(String(options.body)) as {
      organizationIds: string[]
    }
    const selected = input.organizationIds
      .map((id) => rows.find((row) => row.orgId === id))
      .filter((row): row is PilotRow => !!row)
    const response: PilotPreview = {
      previewId: '30000000-0000-4000-8000-000000000001',
      evaluatedAt: '2026-09-03T18:00:00Z',
      rows: selected,
      counts: counts(selected),
      activationEnabled: true,
    }
    return Response.json(response)
  }
  if (
    url === '/api/admin/standalone-pilots/apply' &&
    options.method === 'POST'
  ) {
    applyCalls++
    const response: PilotApplyReport = {
      previewId: '30000000-0000-4000-8000-000000000001',
      completedAt: new Date().toISOString(),
      results:
        applyCalls === 1
          ? [
              {
                orgId: ids.create,
                outcome: 'activated',
                reason: 'create_source',
              },
              {
                orgId: ids.activate,
                outcome: 'failed',
                reason: 'activation_failed',
              },
            ]
          : [
              {
                orgId: ids.create,
                outcome: 'already_applied',
                reason: 'already_applied',
              },
              {
                orgId: ids.activate,
                outcome: 'activated',
                reason: 'activate_source',
              },
            ],
    }
    return Response.json(response)
  }
  throw new Error(
    `Blocked admin pilot fixture request: ${options.method} ${url}`
  )
}
