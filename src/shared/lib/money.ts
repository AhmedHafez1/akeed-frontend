import type { SupportedLocale } from '@/shared/lib/locale'

/**
 * Money and credit formatting shared by the billing screen and the public
 * pricing section.
 *
 * These live in `shared/lib` rather than in `features/billing` so marketing can
 * use them without importing an authenticated feature. Keeping one
 * implementation matters: `Intl` renders EGP with Arabic-Indic digits under the
 * `ar` locale, so a second formatter would make the landing page and the
 * in-app balance disagree about what the same price looks like.
 */
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

export function formatMoneyFromCredits(
  credits: number,
  unitPriceMinor: number,
  currency: string,
  locale: SupportedLocale
) {
  return formatMoney(credits * unitPriceMinor, currency, locale)
}
