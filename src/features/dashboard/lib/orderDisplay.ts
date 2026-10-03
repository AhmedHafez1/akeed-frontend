/**
 * How the embedded dashboard writes an order's money, phone, dates and links.
 *
 * Every value here is rendered inside an LTR island (`<bdi dir="ltr">`), so the
 * strings are built left to right and carry no bidi marks of their own; a mark
 * inside an isolated island is what used to turn `US$ 2,629.95` into
 * `$US 2,629.95` in the Arabic table.
 */

import { symbolThenAmount } from '@/shared/lib/money'

const BIDI_MARKS = new RegExp(
  `[${String.fromCharCode(0x200e, 0x200f, 0x061c)}]`,
  'g'
)

function latinLocale(locale: string): string {
  return `${locale}-u-nu-latn`
}

/**
 * `US$ 2,629.95` in Arabic, `$2,629.95` in English: Latin digits in both, the
 * currency symbol before the amount.
 *
 * `currencyAfter` puts the symbol after the number as the reader meets it —
 * `3,051.50 EGP` in English, and in Arabic `ج.م 751.00` written left to right,
 * so an Arabic reader (right to left) sees the amount first — which the order
 * tables use.
 */
export function formatOrderAmount(
  amount: string | number | null | undefined,
  currency: string | null | undefined,
  locale: string,
  { currencyAfter = false }: { currencyAfter?: boolean } = {}
): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  const code = currency || 'USD'
  try {
    const formatter = new Intl.NumberFormat(latinLocale(locale), {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    if (locale !== 'ar' && !currencyAfter)
      return formatter
        .format(value)
        .replace(BIDI_MARKS, '')
        .replace(/\s+/g, ' ')
    const parts = formatter.formatToParts(value)
    const symbolRaw = parts
      .filter((part) => part.type === 'currency')
      .map((part) => part.value)
      .join('')
    const number = parts
      .filter((part) => part.type !== 'currency' && part.type !== 'literal')
      .map((part) => part.value)
      .join('')
    const symbolClean = symbolRaw.replace(BIDI_MARKS, '')
    // The island is left to right, so the symbol goes first to read second.
    if (currencyAfter && locale === 'ar')
      return symbolThenAmount(symbolClean, number)
    const text = currencyAfter
      ? `${number} ${symbolClean}`
      : `${symbolClean} ${number}`
    return text.trim()
  } catch {
    return `${code} ${value.toFixed(2)}`
  }
}

/** A plain integer or percentage with Latin digits, for use in either locale. */
export function formatCount(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(latinLocale(locale))
      .format(value)
      .replace(BIDI_MARKS, '')
  } catch {
    return String(value)
  }
}

export function formatPercent(value: number | null, locale: string): string {
  if (value === null || !Number.isFinite(value)) return '—'
  try {
    return new Intl.NumberFormat(latinLocale(locale), {
      style: 'percent',
      maximumFractionDigits: 0,
    })
      .format(value / 100)
      .replace(BIDI_MARKS, '')
  } catch {
    return `${Math.round(value)}%`
  }
}

export { formatPhoneInternational } from '@/shared/lib/phone'

/**
 * A `wa.me` chat link, or null when the phone has no digits to dial. With
 * `text`, WhatsApp opens with that message typed in, ready to edit and send.
 */
export function whatsAppChatUrl(
  phone: string | null | undefined,
  text?: string
) {
  const digits = phone?.replace(/\D/g, '') ?? ''
  if (digits.length < 8) return null
  const url = `https://wa.me/${digits}`
  return text ? `${url}?text=${encodeURIComponent(text)}` : url
}

/** Sources with their own name under `dashboard.sources`. */
const NAMED_ORDER_SOURCES: ReadonlySet<string> = new Set([
  'shopify',
  'standalone',
  'easyorders',
  'woocommerce',
  'salla',
  'zid',
])

/**
 * The message key naming where an order came from, or null when the row does
 * not say. A source this build has no name for reads as "another source"
 * instead of showing a raw code.
 */
export function orderSourceLabelKey(
  platform: string | null | undefined
): string | null {
  if (!platform) return null
  return NAMED_ORDER_SOURCES.has(platform)
    ? `sources.${platform}`
    : 'sources.other'
}

/**
 * The order's page in Shopify admin.
 *
 * App Bridge resolves `shopify://admin/...` for the shop the app is embedded
 * in, so no shop domain is needed here. Only Shopify rows have one.
 */
export function shopifyOrderAdminUrl(
  platform: string | null | undefined,
  externalOrderId: string | null | undefined
) {
  if (platform !== 'shopify' || !externalOrderId) return null
  if (!/^\d+$/.test(externalOrderId)) return null
  return `shopify://admin/orders/${externalOrderId}`
}

/** The order number as merchants write it, `#1138`. */
export function formatOrderNumber(orderNumber: string | null | undefined) {
  if (!orderNumber) return null
  return orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`
}

/** Placeholder names the store sends when a checkout has no customer. */
const NAMELESS = new Set(['', 'guest'])

/** The customer's name, or null so the phone can take its place. */
export function customerDisplayName(name: string | null | undefined) {
  const trimmed = name?.trim() ?? ''
  return NAMELESS.has(trimmed.toLowerCase()) ? null : trimmed
}

/** `22 سبتمبر، 5:58 م` / `Sep 22, 5:58 PM`, in the shop's reporting zone. */
export function formatUpdatedAt(
  value: string | null | undefined,
  locale: string,
  timeZone: string
): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  try {
    const day = new Intl.DateTimeFormat(latinLocale(locale), {
      day: 'numeric',
      month: locale === 'ar' ? 'long' : 'short',
      timeZone,
    }).format(date)
    return `${day}${locale === 'ar' ? '، ' : ', '}${formatClockTime(date, locale, timeZone)}`
  } catch {
    return date.toISOString()
  }
}

/** `22 سبتمبر` / `Sep 22`. */
export function formatShortDate(
  value: string | null | undefined,
  locale: string,
  timeZone: string
): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(latinLocale(locale), {
    day: 'numeric',
    month: locale === 'ar' ? 'long' : 'short',
    timeZone,
  }).format(date)
}

export function formatClockTime(
  value: Date | string,
  locale: string,
  timeZone: string
): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(latinLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })
    .format(date)
    .replace(BIDI_MARKS, '')
}

/** `Sep 27 · 3:41 PM` / `27 سبتمبر · 3:41 م`, in the shop's reporting zone. */
export function formatDayAndClock(
  value: string | null | undefined,
  locale: string,
  timeZone: string
): string {
  const day = formatShortDate(value, locale, timeZone)
  if (!day || !value) return '—'
  return `${day} · ${formatClockTime(value, locale, timeZone)}`
}

export type WaitingAge =
  | { unit: 'lessThanHour' }
  | { unit: 'hours' | 'days'; count: number }

/**
 * How long an order has waited, from the server's whole-hour count (so the
 * page never disagrees with itself between server and client clocks): hours
 * for the first day, whole days after that.
 */
export function waitingAge(
  hours: number | null | undefined
): WaitingAge | null {
  if (hours === null || hours === undefined || !Number.isFinite(hours))
    return null
  const safe = Math.max(Math.floor(hours), 0)
  if (safe < 1) return { unit: 'lessThanHour' }
  if (safe < 24) return { unit: 'hours', count: safe }
  return { unit: 'days', count: Math.floor(safe / 24) }
}

/**
 * Up to two initials for an avatar: first letters of the first and last
 * words (`Ahmed Abdelghany Hafez` → `AH`, `أحمد تامر` → `أت`). Latin initials
 * are upper-cased; Arabic has no case.
 */
export function customerInitials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = Array.from(words[0])[0] ?? ''
  const last = words.length > 1 ? (Array.from(words.at(-1)!)[0] ?? '') : ''
  return `${first}${last}`.toLocaleUpperCase('en')
}
