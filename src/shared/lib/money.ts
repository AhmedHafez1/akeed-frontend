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
export function formatPlanPrice(
  amount: number,
  currency: string,
  fractionDigits?: number
) {
  const symbol =
    new Intl.NumberFormat('ar-u-nu-latn', { style: 'currency', currency })
      .formatToParts(amount)
      .find((part) => part.type === 'currency')
      ?.value.replace(/[\s\u200E\u200F\u061C]+/g, '') ?? currency
  const value = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits ?? (Number.isInteger(amount) ? 0 : 2),
    maximumFractionDigits: fractionDigits ?? 2,
  }).format(amount)
  return `${symbol} ${value}`
}

const LRM = String.fromCharCode(0x200e)
const ARABIC_LETTER = new RegExp(
  `[${String.fromCharCode(0x0600)}-${String.fromCharCode(0x06ff)}]`
)
const BIDI_MARKS = new RegExp(
  `[${String.fromCharCode(0x200e, 0x200f, 0x061c)}]`,
  'g'
)

/**
 * Writes an Arabic-locale order amount left to right, symbol first: `ج.م 500.00`.
 * An Arabic reader (right to left) meets the amount first and the currency
 * after it.
 *
 * CLDR's trailing dot (`ج.م.`) would read as a sentence end, so it is dropped.
 * An Arabic symbol beside digits also needs anchoring: the bidi algorithm joins
 * the digits to the symbol's right-to-left run and shows `500.00 ج.م`, so a
 * left-to-right mark follows an Arabic symbol to keep the amount on its right.
 * Latin symbols (`US$`) are left-to-right already and get no mark.
 */
export function symbolThenAmount(symbol: string, number: string): string {
  const clean = symbol.replace(BIDI_MARKS, '').replace(/\.$/, '')
  const anchor = ARABIC_LETTER.test(clean) ? LRM : ''
  return `${clean}${anchor} ${number}`.trim()
}

/**
 * An order amount (major units) with Latin digits: `ج.م 500.00` in Arabic,
 * `EGP 500.00` / `$500.00` in English. Render it inside `<Ltr>`
 * (`<bdi dir="ltr">`) to avoid the `$US 500.00` a bare `Intl` string
 * reorders into. English carries no bidi marks; see `symbolThenAmount` for the
 * one mark the Arabic form uses.
 */
export function formatAmount(
  value: number,
  currency: string,
  locale: SupportedLocale
): string {
  const formatter = new Intl.NumberFormat(`${locale}-u-nu-latn`, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (locale !== 'ar')
    return formatter.format(value).replace(BIDI_MARKS, '').replace(/\s+/g, ' ')
  const parts = formatter.formatToParts(value)
  const number = parts
    .filter((part) => part.type !== 'currency' && part.type !== 'literal')
    .map((part) => part.value)
    .join('')
  const symbol = parts
    .filter((part) => part.type === 'currency')
    .map((part) => part.value)
    .join('')
  return symbolThenAmount(symbol, number)
}

export function formatMoneyFromCredits(
  credits: number,
  unitPriceMinor: number,
  currency: string,
  locale: SupportedLocale
) {
  return formatMoney(credits * unitPriceMinor, currency, locale)
}
