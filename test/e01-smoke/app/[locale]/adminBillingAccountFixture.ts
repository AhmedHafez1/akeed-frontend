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

type Scenario = 'normal' | 'drift' | 'contradictory' | 'readonly' | 'disabled'

export function fixtureScenario(): Scenario {
  if (typeof window === 'undefined') return 'normal'
  const value = new URLSearchParams(window.location.search).get('scenario')
  return value === 'drift' ||
    value === 'contradictory' ||
    value === 'readonly' ||
    value === 'disabled'
    ? value
    : 'normal'
}

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

export function accountDetailFixture(
  orgId: string,
  name: string
): AccountDetail {
  const scenario = fixtureScenario()
  const drift = scenario === 'drift' || scenario === 'contradictory'
  const postedBalance = drift ? -5 : -12
  const heldCredits = 1
  return {
    organization: { id: orgId, name },
    account: {
      status: 'active',
      postedBalance,
      heldCredits,
      availableCredits: Math.max(postedBalance - heldCredits, 0),
      debtCredits: Math.max(-postedBalance, 0),
      balanceState: 'debt',
      version: 9,
      approvedAt: '2026-08-02T09:00:00Z',
      updatedAt: '2026-09-09T10:15:00Z',
    },
    lowBalanceThreshold: 10,
    reconciliation: {
      postedBalance,
      heldCredits,
      ledgerBalance: -12,
      reservationHolds: 1,
      postedDifference: -12 - postedBalance,
      heldDifference: 0,
      consistent: !drift,
      contradictions:
        scenario === 'contradictory'
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
    holds: { items: holds, truncated: false },
    purchases: { items: purchases, truncated: false },
    events: { items: events, truncated: false },
    audit: { items: audit, truncated: true },
  }
}
