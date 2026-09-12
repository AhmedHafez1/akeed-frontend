import type { SupportedLocale } from '@/shared/lib/locale'

export function formatCredits(value: number, locale: SupportedLocale) {
  return new Intl.NumberFormat(locale).format(value)
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

export function formatMoneyFromCredits(
  credits: number,
  unitPriceMinor: number,
  currency: string,
  locale: SupportedLocale
) {
  return formatMoney(credits * unitPriceMinor, currency, locale)
}

export function formatDayAndTime(value: string, locale: SupportedLocale) {
  const date = new Date(value)
  return {
    day: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date),
    time: new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(date),
  }
}
