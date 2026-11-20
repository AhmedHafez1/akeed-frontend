import type { CreditSummary } from './billing.types'

/** What one message costs from each number, in minor units. */
export interface CoverageRates {
  akeed: number
  ownNumber: number
}

/** Messages an amount of credits pays for, from either number. */
export interface MessageCoverage {
  akeed: number
  ownNumber: number
}

/**
 * Both message prices, or null when the API sent no own-number price (an
 * older backend). Coverage figures are alternatives: the same money pays for
 * either many Akeed messages or twice as many from the merchant's number.
 */
export function coverageRates(
  price: CreditSummary['price']
): CoverageRates | null {
  const prices = messagePrices(price)
  if (!prices.ownNumber || prices.ownNumber <= 0 || prices.akeed <= 0)
    return null
  return { akeed: prices.akeed, ownNumber: prices.ownNumber }
}

/**
 * One message's price from each number, in minor units. Read from the API's
 * money fields, or derived from the credit rates of an older backend.
 */
export function messagePrices(price: CreditSummary['price']): {
  akeed: number
  ownNumber: number | null
} {
  const own = price.ownNumberCreditsPerMessage
  return {
    akeed: price.akeedMessagePriceMinor ?? price.messagePriceMinor,
    ownNumber:
      price.ownNumberMessagePriceMinor ??
      (own ? own * price.unitPriceMinor : null),
  }
}

/** Messages an amount of money pays for, from either number. */
export function messageCoverage(
  amountMinor: number,
  rates: CoverageRates
): MessageCoverage {
  const amount = Math.max(0, amountMinor)
  return {
    akeed: Math.floor(amount / rates.akeed),
    ownNumber: Math.floor(amount / rates.ownNumber),
  }
}
