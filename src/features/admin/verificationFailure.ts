import type { AdminStoreVerification } from './admin.model'

export interface VerificationFailure {
  /** A short phrase that fits beside the status badge. */
  label: string
  /** The full explanation, with the provider's code when one was recorded. */
  detail: string
}

type FailureInput = Pick<
  AdminStoreVerification,
  'status' | 'reason' | 'failure_code' | 'failure_title'
>

type FailureText = readonly [label: string, detail: string]

/**
 * WhatsApp error codes reported for a message that was accepted and then not
 * delivered.
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
 */
const DELIVERY_FAILURES: Record<string, FailureText> = {
  '131026': [
    'WhatsApp could not deliver to the customer number',
    'The number may not be on WhatsApp, or the customer has not accepted the latest terms or runs an outdated app.',
  ],
  '131021': [
    'Invalid customer number',
    'The customer number is the same as the sending number.',
  ],
  '131009': [
    'Invalid customer number',
    'WhatsApp rejected the customer number as invalid.',
  ],
  '100': [
    'Invalid customer number',
    'WhatsApp rejected the customer number as invalid.',
  ],
  '131047': [
    '24-hour window closed',
    'The customer last wrote more than 24 hours ago, so a free-form message could not be delivered.',
  ],
  '131049': [
    'Held back by WhatsApp',
    'WhatsApp chose not to deliver the message, to limit how many business messages this customer receives.',
  ],
  '131048': [
    'WhatsApp spam rate limit',
    'WhatsApp limited sends from the Akeed number because of spam signals.',
  ],
  '131056': [
    'Too many messages to this number',
    'Too many messages were sent to this customer number in a short time.',
  ],
  '131042': [
    'WhatsApp payment issue',
    'WhatsApp blocked the send because of a payment problem on the Akeed WhatsApp account.',
  ],
  '130472': [
    'Number in a WhatsApp experiment',
    'The customer number is part of a WhatsApp experiment, so the message was not delivered.',
  ],
}

const REASON_FAILURES: Record<string, FailureText> = {
  provider_not_accepted: [
    'Failed to send: WhatsApp rejected it',
    'WhatsApp rejected the message when Akeed tried to send it. Nothing was sent.',
  ],
  provider_outcome_unknown: [
    'Failed to send: not confirmed',
    'The send to WhatsApp failed or returned no message ID, so it is not known whether the message went out.',
  ],
  template_unavailable: [
    'No template available',
    "No approved WhatsApp template was available for the customer's language. Nothing was sent.",
  ],
  message_text_unavailable: [
    'No message text available',
    'The message text for this send was unavailable. Nothing was sent.',
  ],
  plan_limit_reached: [
    'Plan limit reached',
    "The store's plan limit was reached. Nothing was sent.",
  ],
  billing_not_active: [
    'Billing not active',
    "The store's subscription is not active. Nothing was sent.",
  ],
  integration_inactive: [
    'Store inactive',
    'The store connection is inactive. Nothing was sent.',
  ],
  missing_linked_integration: [
    'Order has no store',
    'The order is not linked to a store connection. Nothing was sent.',
  ],
  source_identity_mismatch: [
    'Store mismatch',
    'The order belongs to a different store identity than this connection. Nothing was sent.',
  ],
  INSUFFICIENT_CREDITS: [
    'No credits',
    'The account had no message credits. Nothing was sent.',
  ],
  CREDIT_ACCOUNT_SUSPENDED: [
    'Credit account suspended',
    'The credit account is suspended. Nothing was sent.',
  ],
  CREDIT_DEBT_OUTSTANDING: [
    'Credit debt outstanding',
    'The credit account has an unsettled debt. Nothing was sent.',
  ],
  CREDIT_ACCOUNT_NOT_PROVISIONED: [
    'Credit account not set up',
    'The credit account has not been set up. Nothing was sent.',
  ],
  PAYMENT_PENDING_RECONCILIATION: [
    'Billing under review',
    'Sending is paused while a payment is reconciled. Nothing was sent.',
  ],
  standalone_approval_required: [
    'Account awaiting approval',
    'The account was waiting for staff approval. Nothing was sent.',
  ],
}
REASON_FAILURES.STANDALONE_APPROVAL_REQUIRED =
  REASON_FAILURES.standalone_approval_required

const DELIVERY_FAILED: FailureText = [
  'Delivery failed',
  'WhatsApp accepted the message but could not deliver it.',
]

const TEMPLATE_PROBLEM: FailureText = [
  'Template problem',
  'WhatsApp could not deliver the message because of a problem with the template.',
]

function deliveryFailure(code: string | null): FailureText {
  if (!code) return DELIVERY_FAILED
  if (DELIVERY_FAILURES[code]) return DELIVERY_FAILURES[code]
  return /^132\d{3}$/.test(code) ? TEMPLATE_PROBLEM : DELIVERY_FAILED
}

function readable(reason: string): string {
  const words = reason.replaceAll('_', ' ').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** What WhatsApp itself said, when it reported a code or a title. */
function providerNote(code: string | null, title: string | null): string {
  if (code && title) return ` WhatsApp error ${code}: ${title}.`
  if (code) return ` WhatsApp error ${code}.`
  return title ? ` WhatsApp said: ${title}.` : ''
}

/**
 * Why a failed verification failed, in words staff can act on. Null when the
 * verification did not fail.
 */
export function describeVerificationFailure(
  verification: FailureInput
): VerificationFailure | null {
  if (verification.status !== 'failed') return null
  const { reason, failure_code: code, failure_title: title } = verification

  if (reason === 'provider_delivery_failed' || (!reason && code)) {
    const [label, detail] = deliveryFailure(code)
    return { label, detail: detail + providerNote(code, title) }
  }
  if (!reason) {
    return {
      label: 'No reason recorded',
      detail: 'The verification failed and no reason was recorded.',
    }
  }
  const known = REASON_FAILURES[reason]
  if (known) return { label: known[0], detail: known[1] }
  return { label: readable(reason), detail: `Reason code: ${reason}.` }
}
