import type { CreditSummary } from './billing.types'

export type BalanceState =
  | 'suspended'
  | 'notProvisioned'
  | 'debt'
  | 'zero'
  | 'low'
  | 'healthy'

export type BalanceTone = 'brand' | 'warning' | 'danger'

type BalanceInput = Pick<
  CreditSummary,
  'status' | 'debtCredits' | 'availableCredits' | 'lowBalanceThreshold'
>

/**
 * The ladder is ordered by severity, not by field: an account that is
 * suspended *and* low is suspended first. Only a low balance is a warning;
 * every state that stops new messages is a danger.
 */
export function resolveBalanceState(summary: BalanceInput): {
  state: BalanceState
  tone: BalanceTone
} {
  if (summary.status === 'suspended')
    return { state: 'suspended', tone: 'danger' }
  if (summary.status === 'not_provisioned')
    return { state: 'notProvisioned', tone: 'danger' }
  if (summary.debtCredits > 0) return { state: 'debt', tone: 'danger' }
  if (summary.availableCredits === 0) return { state: 'zero', tone: 'danger' }
  if (summary.availableCredits <= summary.lowBalanceThreshold)
    return { state: 'low', tone: 'warning' }
  return { state: 'healthy', tone: 'brand' }
}

export type PurchaseBlock =
  | 'disabled'
  | 'suspended'
  | 'notProvisioned'
  | 'readOnly'

/**
 * Why this member cannot buy credits, or `null` when they can. The server
 * decides (`canPurchase`); this only picks the sentence that explains it.
 */
export function purchaseBlock(
  summary: Pick<CreditSummary, 'billingEnabled' | 'canPurchase' | 'status'>
): PurchaseBlock | null {
  if (!summary.billingEnabled) return 'disabled'
  if (summary.canPurchase) return null
  if (summary.status === 'suspended') return 'suspended'
  if (summary.status === 'not_provisioned') return 'notProvisioned'
  return 'readOnly'
}
