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

/**
 * Same output as `formatMoney`, split so a display can size the amount and
 * the currency independently. Derived from `formatToParts` of the very same
 * formatter, so the digits cannot drift from the in-app rendering.
 */
export function formatMoneyParts(
  valueMinor: number,
  currency: string,
  locale: SupportedLocale
) {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).formatToParts(valueMinor / 100)

  // Strip the spacing and bidi marks Intl places around the currency symbol.
  const clean = (value: string) => value.replace(/[\s‎‏؜]+/g, ' ').trim()

  return {
    amount: clean(
      parts
        .filter((part) => part.type !== 'currency')
        .map((part) => part.value)
        .join('')
    ),
    currency: clean(
      parts
        .filter((part) => part.type === 'currency')
        .map((part) => part.value)
        .join('')
    ),
  }
}

/**
 * A subscription price as one left-to-right token, e.g. `US$ 9.99`, for the
 * same string in both locales. `Intl` in `ar` emits `\u200F9.99\u00A0US$`;
 * the leading RLM and the trailing neutral `$` reorder in an RTL paragraph
 * and read as `$US 9.99`. Render the result inside `<bdi dir="ltr">`.
 */
export function formatPlanPrice(amount: number, currency: string) {
  const symbol =
    new Intl.NumberFormat('ar-u-nu-latn', { style: 'currency', currency })
      .formatToParts(amount)
      .find((part) => part.type === 'currency')
      ?.value.replace(/[\s\u200E\u200F\u061C]+/g, '') ?? currency
  const value = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${symbol} ${value}`
}

export function formatMoneyFromCredits(
  credits: number,
  unitPriceMinor: number,
  currency: string,
  locale: SupportedLocale
) {
  return formatMoney(credits * unitPriceMinor, currency, locale)
}
