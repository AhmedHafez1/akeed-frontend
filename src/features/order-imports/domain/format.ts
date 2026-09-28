import { formatAmount } from '@/shared/lib/money'
import type { SupportedLocale } from '@/shared/lib/locale'

/** "412 KB", "1.2 MB", in the page locale. */
export function formatFileSize(bytes: number, locale: string): string {
  const megabytes = bytes / (1024 * 1024)
  if (megabytes >= 1)
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'megabyte',
      maximumFractionDigits: 1,
    }).format(megabytes)
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilobyte',
    maximumFractionDigits: 0,
  }).format(Math.max(1, Math.round(bytes / 1024)))
}

/**
 * A normalized `750.00` amount in its currency, as the confirmations list
 * writes it (`750.00 ج.م`). Render inside `<Ltr>`.
 */
export function formatImportAmount(
  totalPrice: string | undefined,
  currency: string | undefined,
  locale: SupportedLocale
): string | null {
  if (!totalPrice || !currency) return null
  const value = Number(totalPrice)
  if (!Number.isFinite(value)) return null
  try {
    return formatAmount(value, currency, locale)
  } catch {
    return `${totalPrice} ${currency}`
  }
}

/** A calendar date (`2026-09-12`) as "12 Sep 2026", read as a date, not a time. */
export function formatImportDate(
  isoDate: string,
  locale: string,
  withYear = true
): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}
