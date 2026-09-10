import { adminRequest } from './adminApi'
import type {
  BillingFindingFilters,
  BillingFindingsPage,
  BillingHealth,
  BillingSettlement,
  BillingSettlementsPage,
} from './billing-observability.model'

const path = '/api/admin/standalone-billing'

export function getBillingHealth(from?: string, to?: string) {
  const query = new URLSearchParams()
  if (from) query.set('from', from)
  if (to) query.set('to', to)
  return adminRequest<BillingHealth>(`${path}/health?${query}`)
}

export function getBillingFindings(filters: BillingFindingFilters) {
  const query = new URLSearchParams({ limit: '50' })
  if (filters.status) query.set('status', filters.status)
  if (filters.severity) query.set('severity', filters.severity)
  if (filters.code.trim()) query.set('code', filters.code.trim())
  return adminRequest<BillingFindingsPage>(
    `${path}/reconciliation/findings?${query}`
  )
}

export function requestBillingReconciliation(reason: string) {
  return adminRequest<{ runId: string; status: string; mode: string }>(
    `${path}/reconciliation/runs`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }
  )
}

export function getBillingSettlements() {
  return adminRequest<BillingSettlementsPage>(`${path}/settlements?limit=50`)
}

export function postBillingSettlement(
  settlement: Omit<
    BillingSettlement,
    'id' | 'revision' | 'actorId' | 'createdAt' | 'effective'
  >,
  idempotencyKey: string
) {
  return adminRequest<BillingSettlement & { duplicate: boolean }>(
    `${path}/settlements`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(settlement),
    }
  )
}
