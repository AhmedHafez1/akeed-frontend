import { getFormatLocale, type SupportedLocale } from '@/shared/lib/locale'

/**
 * Prepaid balances, costs and top-ups as money.
 *
 * The API counts in displayed credits, each worth `price.unitPriceMinor`
 * (EGP 0.50 by default). Merchants never see those: every credit number on
 * its way to the screen passes through `creditsToMinor` and `formatBalance`.
 * A purchase still goes to the API as a displayed quantity, so
 * `minorToCredits` turns an amount back.
 */

const BIDI_MARKS = new RegExp(
  `[${String.fromCharCode(0x200e, 0x200f, 0x061c)}]`,
  'g'
)

/** Displayed credits as money, in the currency's minor unit. */
export function creditsToMinor(credits: number, unitPriceMinor: number) {
  return credits * unitPriceMinor
}

/**
 * Money as displayed credits, rounded up so a shortfall is always covered.
 * `0` when the unit price is unknown.
 */
export function minorToCredits(valueMinor: number, unitPriceMinor: number) {
  if (unitPriceMinor <= 0) return 0
  return Math.ceil(valueMinor / unitPriceMinor)
}

/**
 * An amount with Western digits and no `.00` on whole amounts: `EGP 150.5`
 * and `EGP 100` in English, `150.5 ج.م` in Arabic, `150,5 EGP` in French.
 * `fixed` keeps two decimals, for receipts that list exact amounts.
 *
 * `Intl` under `ar` wraps the amount in bidi marks and ends the symbol with a
 * dot (`ج.م.`) that reads as a full stop, so the Arabic string is built here.
 * Render the result inside `<bdi>` so it keeps its order within a sentence.
 */
export function formatBalance(
  valueMinor: number,
  currency: string,
  locale: SupportedLocale,
  options: { fixed?: boolean } = {}
) {
  const fraction = {
    minimumFractionDigits: options.fixed ? 2 : 0,
    maximumFractionDigits: 2,
  }
  const value = valueMinor / 100
  if (getFormatLocale(locale) !== 'ar') {
    try {
      return new Intl.NumberFormat(`${getFormatLocale(locale)}-u-nu-latn`, {
        style: 'currency',
        currency,
        currencyDisplay: 'code',
        ...fraction,
      })
        .format(value)
        .replace(BIDI_MARKS, '')
        .replace(/\s+/g, ' ')
    } catch {
      return `${currency} ${new Intl.NumberFormat('en-US', fraction).format(value)}`
    }
  }

  const amount = new Intl.NumberFormat('en-US', fraction).format(value)
  const symbol =
    new Intl.NumberFormat('ar', { style: 'currency', currency })
      .formatToParts(0)
      .find((part) => part.type === 'currency')
      ?.value.replace(BIDI_MARKS, '')
      .replace(/\.$/, '') ?? currency
  return `${amount} ${symbol}`
}

/**
 * `formatBalance` split for a display that sizes the amount and the currency
 * differently, with whether the currency comes first in this language.
 */
export function formatBalanceParts(
  valueMinor: number,
  currency: string,
  locale: SupportedLocale
): { amount: string; currency: string; currencyFirst: boolean } {
  const whole = formatBalance(valueMinor, currency, locale)
  const amount = /[\d.,\s]*\d/.exec(whole)?.[0].trim() ?? whole
  const index = whole.indexOf(amount)
  const before = whole.slice(0, index).trim()
  const after = whole.slice(index + amount.length).trim()
  return {
    amount,
    currency: before || after,
    currencyFirst: before.length > 0,
  }
}
