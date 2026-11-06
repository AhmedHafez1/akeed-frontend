import type { CreditSummary } from './billing.types'

/** Credits one message uses from each number. */
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
 * Both rates, or null when the API sent no own-number rate (an older
 * backend). Coverage figures are alternatives: the same credits pay for
 * either many Akeed messages or twice as many from the merchant's number.
 */
export function coverageRates(
  price: CreditSummary['price']
): CoverageRates | null {
  const ownNumber = price.ownNumberCreditsPerMessage
  if (!ownNumber || ownNumber <= 0 || price.creditsPerMessage <= 0) return null
  return { akeed: price.creditsPerMessage, ownNumber }
}

export function messageCoverage(
  credits: number,
  rates: CoverageRates
): MessageCoverage {
  const whole = Math.max(0, Math.floor(credits))
  return {
    akeed: Math.floor(whole / rates.akeed),
    ownNumber: Math.floor(whole / rates.ownNumber),
  }
}
