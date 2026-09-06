import type { VerificationItem } from '../model/dashboard.model'
import { EXPLAINED_LIFECYCLE_REASONS } from './verificationLifecycle'

/**
 * Every value a verification row displays, derived once.
 *
 * Both tables render the same seven columns from these helpers, so a row shows
 * the same order title, the same total, the same date and the same explanation
 * whichever runtime mode a merchant is looking at. Formatting is pinned to the
 * organization's reporting timezone rather than the browser's, which is what
 * previously let one mode date a row a day apart from the other.
 */

export function formatOrderTitle(
  verification: VerificationItem,
  fallbackLabel: string
): string {
  if (verification.order_number) {
    return `#${verification.order_number}`
  }
  return `${fallbackLabel} ${verification.order_id.slice(0, 8)}`
}

export function formatCurrencyTotal(
  verification: VerificationItem,
  locale: string
): string {
  if (!verification.total_price) return '-'

  const currency = verification.currency ?? 'SAR'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(verification.total_price))
  } catch {
    return `${verification.total_price} ${currency}`
  }
}

export function formatCreatedDate(
  value: string | null,
  locale: string,
  timeZone: string
): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(date)
}

export function formatCreatedTime(
  value: string | null,
  locale: string,
  timeZone: string
): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date)
}

export function formatTooltipDateTime(
  value: string | null,
  locale: string,
  timeZone: string
): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date)
}

/** The timestamp that explains when the row reached its current status. */
export function getStatusTimestamp(
  verification: VerificationItem
): string | null {
  switch (verification.status) {
    case 'sent':
      return verification.last_sent_at
    case 'delivered':
      return verification.delivered_at
    case 'read':
      return verification.read_at
    case 'confirmed':
      return verification.confirmed_at
    case 'canceled':
      return verification.canceled_at
    case 'expired':
      return verification.expired_at
    case 'no_reply':
      return verification.no_reply_at
    default:
      return null
  }
}

/**
 * The i18n key for the row's explanatory sub-line.
 *
 * A recorded reason wins over the generic status description, because it says
 * something the status alone cannot — which plan limit was hit, which source
 * went inactive. An unrecognized reason code falls back to a generic sentence
 * rather than rendering a raw identifier at the merchant.
 */
export function resolveRowDescriptionKey(
  verification: VerificationItem
): string {
  const reason = verification.reason
  if (reason) {
    return EXPLAINED_LIFECYCLE_REASONS.has(reason)
      ? `reasons.${reason}`
      : 'reasons.generic'
  }
  return `descriptions.${verification.status}`
}
