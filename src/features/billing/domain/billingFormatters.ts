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

/**
 * When a purchase last changed: `1 أكتوبر 2026 · 8:52 ص` /
 * `Oct 1, 2026 · 8:52 AM`, with Western digits in both locales.
 * It holds Arabic words, so render it in `<bdi>` rather than forcing LTR.
 */
export function formatBillingDate(value: string, locale: SupportedLocale) {
  const date = new Date(value)
  const tag = `${locale}-u-nu-latn`
  const day = new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
  const time = new Intl.DateTimeFormat(tag, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
  return `${day} · ${time}`
}

/**
 * Purchase references are `akd_` + 32 hex characters, too long to read. The
 * merchant only matches one against a receipt, so the first and last four are
 * enough: `akd_4e1f…9b07`. Anything shorter is returned whole.
 */
export function formatShortRef(value: string) {
  const separator = value.indexOf('_')
  const prefix = value.slice(0, separator + 1)
  const body = value.slice(separator + 1)
  if (body.length <= 9) return value
  return `${prefix}${body.slice(0, 4)}…${body.slice(-4)}`
}
