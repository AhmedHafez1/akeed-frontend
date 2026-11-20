'use client'

import { useLocale } from 'next-intl'
import { useBillingSummary } from '@/features/billing'
import { creditsToMinor, formatBalance } from '@/shared/lib/balanceMoney'
import { formatCredits } from '@/shared/lib/money'
import type { SupportedLocale } from '@/shared/lib/locale'

export interface CreditOffer {
  /** Free confirmations available now, already localized. */
  count: string
  /** The balance those confirmations come from, as money, e.g. "EGP 100". */
  balance: string
  /** Price of one confirmation after them, e.g. "1 ج.م" / "EGP 1". */
  price: string
}

/**
 * The free-message offer shown on the setup and success screens, from the
 * same cached balance the rest of the app reads. `offer` stays null until
 * it has loaded, so no screen ever renders a placeholder "0".
 */
export function useCreditOffer() {
  const locale = useLocale() as SupportedLocale
  const { summary, isLoading } = useBillingSummary()
  if (!summary) return { offer: null, isLoading }
  const { price } = summary
  const offer: CreditOffer = {
    count: formatCredits(
      Math.floor(summary.availableCredits / price.creditsPerMessage),
      locale
    ),
    balance: formatBalance(
      summary.balanceMinor ??
        creditsToMinor(summary.availableCredits, price.unitPriceMinor),
      price.currency,
      locale
    ),
    price: formatBalance(
      price.akeedMessagePriceMinor ?? price.messagePriceMinor,
      price.currency,
      locale
    ),
  }
  return { offer, isLoading }
}
