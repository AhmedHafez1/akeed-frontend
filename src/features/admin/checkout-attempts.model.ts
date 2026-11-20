export const CHECKOUT_PAID_FILTERS = ['unpaid', 'paid', 'all'] as const
export type CheckoutPaidFilter = (typeof CHECKOUT_PAID_FILTERS)[number]

export type CheckoutOutcome =
  | 'paid'
  | 'declined'
  | 'failed'
  | 'canceled'
  | 'left_checkout'
  | 'in_checkout'

/** One merchant who opened Paymob checkout, as the staff list shows it. */
export interface CheckoutAttemptRow {
  orgId: string
  organizationName: string | null
  owner: {
    name: string | null
    email: string | null
    whatsappPhone: string | null
  }
  source: { platformType: string; identity: string } | null
  attempts: number
  firstAttemptAt: string
  lastAttemptAt: string
  paidEver: boolean
  latest: {
    reference: string
    status: string
    outcome: CheckoutOutcome
    declineCode: string | null
    reconciliationCode: string | null
    totalMinor: number
    currency: string
  }
}

export interface CheckoutAttemptsPage {
  rows: CheckoutAttemptRow[]
  nextOffset: number | null
}

/** Provider codes arrive as `authentication_failed`; staff read words. */
export function readableCode(code: string): string {
  return code.replace(/_/g, ' ')
}

/** The marker for a merchant whose latest try failed after an earlier payment. */
export function paidEarlier(row: CheckoutAttemptRow): boolean {
  return row.paidEver && row.latest.outcome !== 'paid'
}
