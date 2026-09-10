import type { SupportedLocale } from '@/shared/lib/locale'

export const RECONCILIATION_CODES = [
  'provider_rejected',
  'provider_unavailable',
  'callback_mismatch',
  'partial_refund_not_whole_credit',
  'refund_without_success',
  'refund_reference_missing',
  'dispute_open',
  'dispute_lost',
  'dispute_without_grant',
  'credit_invariant_frozen',
  'inquiry_unresolved',
  'staff_evidence_mismatch',
] as const

export const DISPATCH_STATES = [
  'ready',
  'sending',
  'accepted',
  'rejected',
  'outcome_unknown',
] as const

export const AUDIT_ACTIONS = [
  'standalone-billing.approve',
  'standalone-billing.adjustment.preview',
  'standalone-billing.adjustment.apply',
  'standalone-billing.purchase.reconcile',
  'standalone-billing.purchase.provider-action',
  'standalone-billing.projection-repair.preview',
  'standalone-billing.projection-repair.apply',
  'message-dispatch.resolve',
] as const

/** Staff and provider codes as translation keys (dots are key separators). */
export function codeKey(code: string) {
  return code.replaceAll('.', '_').replaceAll('-', '_')
}

export function isKnown<T extends string>(
  list: readonly T[],
  value: string | null | undefined
): value is T {
  return !!value && (list as readonly string[]).includes(value)
}

/**
 * Wraps a figure in a left-to-right isolate, so a debt of `-5` keeps its sign
 * in front inside Arabic text instead of rendering as `5-`.
 */
function isolate(value: string) {
  return `⁦${value}⁩`
}

export function formatNumber(value: number, locale: SupportedLocale) {
  return isolate(new Intl.NumberFormat(locale).format(value))
}

export function formatSigned(value: number, locale: SupportedLocale) {
  return isolate(
    new Intl.NumberFormat(locale, { signDisplay: 'exceptZero' }).format(value)
  )
}

export function formatMoney(
  valueMinor: number,
  currency: string,
  locale: SupportedLocale
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(valueMinor / 100)
}

export function formatDateTime(
  value: string | null | undefined,
  locale: SupportedLocale
) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
