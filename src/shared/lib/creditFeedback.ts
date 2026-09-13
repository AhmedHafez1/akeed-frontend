const creditFeedbackKeys = {
  CREDIT_ACCOUNT_NOT_PROVISIONED: 'notProvisioned',
  CREDIT_ACCOUNT_SUSPENDED: 'suspended',
  CREDIT_DEBT_OUTSTANDING: 'debt',
  INSUFFICIENT_CREDITS: 'insufficient',
  PAYMENT_PENDING_RECONCILIATION: 'reconciliation',
} as const

export type CreditDenialCode = keyof typeof creditFeedbackKeys

export function creditFeedbackKey(code: unknown) {
  return typeof code === 'string' && Object.hasOwn(creditFeedbackKeys, code)
    ? creditFeedbackKeys[code as CreditDenialCode]
    : undefined
}
