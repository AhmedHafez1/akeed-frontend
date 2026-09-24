import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber'

/**
 * How the embedded dashboard writes an order's money, phone, dates and links.
 *
 * Every value here is rendered inside an LTR island (`<bdi dir="ltr">`), so the
 * strings are built left to right and carry no bidi marks of their own; a mark
 * inside an isolated island is what used to turn `US$ 2,629.95` into
 * `$US 2,629.95` in the Arabic table.
 */

const BIDI_MARKS = new RegExp(
  `[${String.fromCharCode(0x200e, 0x200f, 0x061c)}]`,
  'g'
)

function latinLocale(locale: string): string {
  return `${locale}-u-nu-latn`
}

/**
 * `US$ 2,629.95` in Arabic, `$2,629.95` in English: Latin digits in both, the
 * currency symbol always before the amount.
 */
export function formatOrderAmount(
  amount: string | number | null | undefined,
  currency: string | null | undefined,
  locale: string
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
    if (locale !== 'ar')
      return formatter
        .format(value)
        .replace(BIDI_MARKS, '')
        .replace(/\s+/g, ' ')
    const parts = formatter.formatToParts(value)
    const symbol = parts
      .filter((part) => part.type === 'currency')
      .map((part) => part.value)
      .join('')
    const number = parts
      .filter((part) => part.type !== 'currency' && part.type !== 'literal')
      .map((part) => part.value)
      .join('')
    return `${symbol} ${number}`.replace(BIDI_MARKS, '').trim()
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

const phoneUtil = PhoneNumberUtil.getInstance()

/**
 * `+20 100 761 1456`.
 *
 * libphonenumber groups Egyptian mobiles as `+20 10 07611456`, which merchants
 * do not recognise, so the ten-digit mobile range is grouped 3-3-4 the way it
 * is written locally. Every other number uses the library's international form;
 * anything unparseable is shown as stored.
 */
export function formatPhoneInternational(phone: string | null | undefined) {
  if (!phone) return ''
  const trimmed = phone.trim()
  try {
    const parsed = phoneUtil.parse(
      trimmed.startsWith('+') ? trimmed : `+${trimmed.replace(/\D/g, '')}`
    )
    const national = String(parsed.getNationalNumber() ?? '')
    if (parsed.getCountryCode() === 20 && /^1\d{9}$/.test(national)) {
      return `+20 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
    }
    return phoneUtil.format(parsed, PhoneNumberFormat.INTERNATIONAL)
  } catch {
    return trimmed
  }
}

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
