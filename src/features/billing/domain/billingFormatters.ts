import type { SupportedLocale } from '@/shared/lib/locale'

/*
 * Credit counts are shared with the public pricing section, so they live in
 * `shared/lib/money`. Re-exported here to keep billing's own imports pointed
 * at one module.
 */
export { formatCredits } from '@/shared/lib/money'

const BIDI_MARKS = new RegExp(
  `[${String.fromCharCode(0x200e, 0x200f, 0x061c)}]`,
  'g'
)

/**
 * A billing amount with Western digits and two decimals: `1,000.00 ج.م` in
 * Arabic (the amount, then the currency) and `EGP 1,000.00` in English.
 *
 * `Intl` under `ar` wraps the amount in bidi marks and ends the symbol with a
 * dot (`ج.م.`) that reads as a full stop, so the string is built here instead.
 * Render it inside `<bdi>` so it keeps its order within a sentence.
 */
export function formatMoney(
  valueMinor: number,
  currency: string,
  locale: SupportedLocale
) {
  const amount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueMinor / 100)
  if (locale !== 'ar') return `${currency} ${amount}`

  const symbol =
    new Intl.NumberFormat('ar', { style: 'currency', currency })
      .formatToParts(0)
      .find((part) => part.type === 'currency')
      ?.value.replace(BIDI_MARKS, '')
      .replace(/.$/, '') ?? currency
  return `${amount} ${symbol}`
}

/** `12 سبتمبر` / `Sep 12`; the year only when it is not this one. */
export function formatShortDate(
  value: string,
  locale: SupportedLocale,
  now: Date = new Date()
) {
  const date = new Date(value)
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  }).format(date)
}

export function formatBillingDate(value: string, locale: SupportedLocale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

/**
 * Purchase references are `akd_` + 32 hex characters — far too long for a
 * table cell, and the merchant only ever uses them to match a row against a
 * receipt, so the leading bytes are enough to be unambiguous in practice.
 */
export function formatShortRef(value: string) {
  const [prefix, ...rest] = value.split('_')
  const body = rest.join('_')
  return body ? `${prefix}_${body.slice(0, 7)}` : value.slice(0, 11)
}

export function formatDayAndTime(value: string, locale: SupportedLocale) {
  const date = new Date(value)
  return {
    day: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date),
    time: new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(date),
  }
}
