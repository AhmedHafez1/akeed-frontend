import type {
  AccountDetail,
  AuditRow,
  HoldRow,
  LedgerRow,
  ProviderEventRow,
  PurchaseRow,
} from '@/features/admin/standalone-billing-operations.model'

/**
 * Synthetic staff billing account detail.
 *
 * The page URL selects the scenario, because the fixture only sees API paths:
 * `?scenario=drift` shows a projection that no longer matches its ledger,
 * `contradictory` adds a hold on a settled send, `readonly` removes operator
 * access and `disabled` switches operations off.
 */
export const DEBT_ORG = '10000000-0000-4000-8000-000000000005'
const STAFF = '40000000-0000-4000-8000-000000000001'
const HOLD_DISPATCH = '50000000-0000-4000-8000-000000000001'

type Scenario =
  | 'normal'
  | 'drift'
  | 'contradictory'
  | 'readonly'
  | 'disabled'
  | 'stale'

export function fixtureScenario(): Scenario {
  if (typeof window === 'undefined') return 'normal'
  const value = new URLSearchParams(window.location.search).get('scenario')
  return value === 'drift' ||
    value === 'contradictory' ||
    value === 'readonly' ||
    value === 'disabled' ||
    value === 'stale'
    ? value
    : 'normal'
}

interface FixtureCall {
  method: string
  path: string
  idempotencyKey: string | null
  body: Record<string, unknown>
}

/** In-memory effects of fixture operations, reset by a page reload. */
const state = {
  adjustment: 0,
  repaired: false,
  resolved: false,
  appliedKeys: new Map<string, number>(),
  calls: [] as FixtureCall[],
}

/** Inspect operation requests from the browser console. */
if (typeof window !== 'undefined')
  (
    window as typeof window & { __akeedAdminBillingCalls?: FixtureCall[] }
  ).__akeedAdminBillingCalls = state.calls

const holds: HoldRow[] = [
  {
    reservationId: '60000000-0000-4000-8000-000000000001',
    dispatchId: HOLD_DISPATCH,
    verificationId: '70000000-0000-4000-8000-000000000001',
    kind: 'initial',
    generation: 1,
    quantity: 1,
    createdAt: '2026-09-09T10:15:00Z',
    dispatchState: 'outcome_unknown',
    accountingMode: 'prepaid_credit',
    attemptCount: 1,
    lastErrorCode: 'provider_timeout',
    providerMessageIdRecorded: false,
    leaseUntil: null,
  },
]

export const PENDING_REF = 'akd_0000000000000000000000000000aaaa'
export const REFUNDED_REF = 'akd_0000000000000000000000000000bbbb'

const purchases: PurchaseRow[] = [
  {
    reference: PENDING_REF,
    provider: 'paymob',
    mode: 'test',
    status: 'pending',
    disputeStatus: 'none',
    quantity: 100,
    unitPriceMinor: 200,
    totalMinor: 20000,
    currency: 'EGP',
    refundedMinor: 0,
    providerOrderId: 'ord-3310',
    providerTransactionId: null,
    checkoutExpiresAt: '2026-09-09T11:00:00Z',
    reconciliationRequired: true,
    reconciliationCode: 'inquiry_unresolved',
    reconciliationAttempts: 2,
    nextReconciliationAt: '2026-09-10T08:00:00Z',
    createdAt: '2026-09-09T10:45:00Z',
    updatedAt: '2026-09-09T11:30:00Z',
  },
  {
    reference: REFUNDED_REF,
    provider: 'paymob',
    mode: 'test',
    status: 'refunded',
    disputeStatus: 'none',
    quantity: 100,
    unitPriceMinor: 200,
    totalMinor: 20000,
    currency: 'EGP',
    refundedMinor: 20000,
    providerOrderId: 'ord-3001',
    providerTransactionId: 'txn-9001',
    checkoutExpiresAt: '2026-08-10T11:00:00Z',
    reconciliationRequired: false,
    reconciliationCode: null,
    reconciliationAttempts: 0,
    nextReconciliationAt: null,
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z',
  },
]

const ledger: LedgerRow[] = [
  {
    id: '80000000-0000-4000-8000-000000000004',
    type: 'refund_reversal',
    quantity: -100,
    reason: 'refund_reversal',
    actorId: STAFF,
    purchaseRef: REFUNDED_REF,
    dispatchId: null,
    reservationId: null,
    sourceLedgerEntryId: '80000000-0000-4000-8000-000000000002',
    sourceReference: 'rf-7001',
    postedBalanceBefore: 88,
    postedBalanceAfter: -12,
    createdAt: '2026-09-01T09:00:00Z',
  },
  {
    id: '80000000-0000-4000-8000-000000000003',
    type: 'consumption',
    quantity: -42,
    reason: 'provider_accepted',
    actorId: null,
    purchaseRef: null,
    dispatchId: '50000000-0000-4000-8000-000000000009',
    reservationId: '60000000-0000-4000-8000-000000000009',
    sourceLedgerEntryId: null,
    sourceReference: null,
    postedBalanceBefore: 130,
    postedBalanceAfter: 88,
    createdAt: '2026-08-20T12:00:00Z',
  },
  {
    id: '80000000-0000-4000-8000-000000000002',
    type: 'purchase',
    quantity: 100,
    reason: 'provider_payment_verified',
    actorId: null,
    purchaseRef: REFUNDED_REF,
    dispatchId: null,
    reservationId: null,
    sourceLedgerEntryId: null,
    sourceReference: null,
    postedBalanceBefore: 30,
    postedBalanceAfter: 130,
    createdAt: '2026-08-10T10:05:00Z',
  },
  {
    id: '80000000-0000-4000-8000-000000000001',
    type: 'free_grant',
    quantity: 30,
    reason: 'Approved pilot merchant',
    actorId: STAFF,
    purchaseRef: null,
    dispatchId: null,
    reservationId: null,
    sourceLedgerEntryId: null,
    sourceReference: null,
    postedBalanceBefore: 0,
    postedBalanceAfter: 30,
    createdAt: '2026-08-02T09:00:00Z',
  },
]

const events: ProviderEventRow[] = [
  {
    id: '90000000-0000-4000-8000-000000000002',
    provider: 'akeed_staff',
    purchaseRef: REFUNDED_REF,
    verified: false,
    resultCode: 'transitioned',
    errorCode: null,
    receivedAt: '2026-09-01T09:00:00Z',
    processedAt: '2026-09-01T09:00:00Z',
  },
  {
    id: '90000000-0000-4000-8000-000000000001',
    provider: 'paymob',
    purchaseRef: REFUNDED_REF,
    verified: true,
    resultCode: 'granted',
    errorCode: null,
    receivedAt: '2026-08-10T10:05:00Z',
    processedAt: '2026-08-10T10:05:00Z',
  },
]

const audit: AuditRow[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    action: 'standalone-billing.purchase.provider-action',
    outcome: 'allowed',
    actorId: STAFF,
    requestId: 'req-fixture-2',
    createdAt: '2026-09-01T09:00:00Z',
    summary: {
      reason: 'Finance confirmed the refund with Paymob',
      evidence: 'Paymob refund rf-7001',
      providerAction: 'refund',
      providerReference: 'rf-7001',
      amountMinor: 20000,
      outcome: 'reversed',
    },
  },
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    action: 'standalone-billing.approve',
    outcome: 'allowed',
    actorId: STAFF,
    requestId: null,
    createdAt: '2026-08-02T09:00:00Z',
    summary: { reason: 'Approved pilot merchant' },
  },
]

function projection(postedBalance: number, heldCredits: number) {
  return {
    postedBalance,
    heldCredits,
    availableCredits: Math.max(postedBalance - heldCredits, 0),
    debtCredits: Math.max(-postedBalance, 0),
  }
}

function refuse(status: number, code: string) {
  return Response.json({ message: code, code }, { status })
}

/**
 * Answers the staff operation endpoints with the backend's response shapes.
 * Idempotency keys are honoured so a retried apply answers as a duplicate.
 */
export async function accountOperationFixture(
  url: string,
  options: RequestInit
): Promise<Response | null> {
  if (options.method !== 'POST') return null
  const path = url.replace('/api/admin/standalone-billing', '')
  const body = JSON.parse(String(options.body ?? '{}')) as Record<
    string,
    unknown
  >
  const headers = new Headers(options.headers)
  state.calls.push({
    method: 'POST',
    path,
    idempotencyKey: headers.get('Idempotency-Key'),
    body,
  })
  const scenario = fixtureScenario()
  const posted = currentPosted()
  if (path.endsWith('/adjustments/preview')) {
    const quantity = Number(body.quantity)
    if (scenario === 'drift' || scenario === 'contradictory')
      return refuse(409, 'CREDIT_PROJECTION_MISMATCH')
    return Response.json({
      previewId: 'b0000000-0000-4000-8000-000000000001',
      fingerprint: 'f'.repeat(64),
      orgId: DEBT_ORG,
      quantity,
      evaluatedAt: new Date().toISOString(),
      before: projection(posted, 1),
      after: projection(posted + quantity, 1),
    })
  }
  if (path.endsWith('/adjustments/apply')) {
    if (scenario === 'readonly' || scenario === 'disabled')
      return refuse(403, 'STANDALONE_BILLING_OPERATOR_REQUIRED')
    if (scenario === 'stale') return refuse(409, 'BILLING_PREVIEW_STALE')
    const key = headers.get('Idempotency-Key')
    if (!key) return refuse(400, 'BILLING_IDEMPOTENCY_KEY_REQUIRED')
    const quantity = state.appliedKeys.get(key) ?? 25
    const duplicate = state.appliedKeys.has(key)
    if (!duplicate) {
      state.appliedKeys.set(key, quantity)
      state.adjustment += quantity
    }
    return Response.json({
      outcome: duplicate ? 'duplicate' : 'applied',
      ledgerEntryId: 'c0000000-0000-4000-8000-000000000001',
      quantity,
      before: projection(currentPosted() - quantity, 1),
      after: projection(currentPosted(), 1),
      appliedAt: new Date().toISOString(),
    })
  }
  if (path.endsWith('/projection-repair/preview')) {
    const report = accountDetailFixture(DEBT_ORG, '').reconciliation!
    const outcome = report.contradictions.length
      ? 'contradictory'
      : report.consistent
        ? 'already_consistent'
        : 'repairable'
    return Response.json({
      outcome,
      previewId:
        outcome === 'repairable'
          ? 'b0000000-0000-4000-8000-000000000002'
          : null,
      fingerprint: outcome === 'repairable' ? 'e'.repeat(64) : null,
      evaluatedAt: new Date().toISOString(),
      reconciliation: report,
      ledgerEntries: ledger.length,
      before: projection(report.postedBalance, report.heldCredits),
      after: projection(report.ledgerBalance, report.reservationHolds),
    })
  }
  if (path.endsWith('/projection-repair/apply')) {
    state.repaired = true
    return Response.json({
      outcome: 'repaired',
      before: projection(-5, 1),
      after: projection(-12, 1),
    })
  }
  if (path.startsWith('/dispatches/')) {
    if (body.resolution === 'accepted' && !body.providerMessageId)
      return refuse(400, 'VALIDATION')
    state.resolved = true
    return Response.json({
      outcome: body.resolution === 'accepted' ? 'accepted' : 'rejected',
      dispatchId: HOLD_DISPATCH,
      duplicate: false,
    })
  }
  if (path.endsWith('/reconcile'))
    return Response.json({
      outcome: 'deferred',
      reference: PENDING_REF,
      ingest: null,
      purchase: {
        status: 'pending',
        reconciliationRequired: true,
        reconciliationCode: 'inquiry_unresolved',
        reconciliationAttempts: 3,
        nextReconciliationAt: new Date().toISOString(),
      },
    })
  if (path.endsWith('/provider-action')) {
    const amount = Number(body.amountMinor)
    if (body.currency !== 'EGP')
      return Response.json({
        outcome: 'quarantined',
        reference: REFUNDED_REF,
        errorCode: 'currency_mismatch',
        reconciliationCode: 'staff_evidence_mismatch',
      })
    if (amount % 200 !== 0)
      return Response.json({
        outcome: 'quarantined',
        reference: REFUNDED_REF,
        reconciliationCode: 'partial_refund_not_whole_credit',
        reversal: null,
      })
    return Response.json({
      outcome: 'no_change',
      reference: REFUNDED_REF,
      reversal: null,
    })
  }
  return null
}

function currentPosted() {
  const scenario = fixtureScenario()
  const drift =
    (scenario === 'drift' || scenario === 'contradictory') && !state.repaired
  return (drift ? -5 : -12) + state.adjustment
}

export function accountDetailFixture(
  orgId: string,
  name: string
): AccountDetail {
  const scenario = fixtureScenario()
  const drift =
    (scenario === 'drift' || scenario === 'contradictory') && !state.repaired
  const postedBalance = currentPosted()
  const heldCredits = state.resolved ? 0 : 1
  const ledgerBalance = -12 + state.adjustment
  const balanceState =
    postedBalance < 0
      ? 'debt'
      : postedBalance - heldCredits <= 0
        ? 'zero'
        : postedBalance - heldCredits <= 10
          ? 'low'
          : 'ok'
  return {
    organization: { id: orgId, name },
    account: {
      status: 'active',
      ...projection(postedBalance, heldCredits),
      balanceState,
      version: 9,
      approvedAt: '2026-08-02T09:00:00Z',
      updatedAt: '2026-09-09T10:15:00Z',
    },
    lowBalanceThreshold: 10,
    reconciliation: {
      postedBalance,
      heldCredits,
      ledgerBalance,
      reservationHolds: heldCredits,
      postedDifference: ledgerBalance - postedBalance,
      heldDifference: 0,
      consistent: !drift,
      contradictions:
        scenario === 'contradictory' && !state.repaired
          ? [
              {
                code: 'reservation_held_on_settled_dispatch',
                reservationId: holds[0].reservationId,
              },
            ]
          : [],
    },
    mutationsBlocked: drift,
    operations: {
      enabled: scenario !== 'disabled',
      operator: scenario !== 'readonly' && scenario !== 'disabled',
    },
    ledger: { items: ledger, truncated: false },
    holds: { items: state.resolved ? [] : holds, truncated: false },
    purchases: { items: purchases, truncated: false },
    events: { items: events, truncated: false },
    audit: { items: audit, truncated: true },
  }
}
