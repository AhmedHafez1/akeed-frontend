'use client'

import { useLocale } from 'next-intl'
import { useBillingSummary } from '@/features/billing'
import { formatCredits, formatMoneyParts } from '@/shared/lib/money'
import type { SupportedLocale } from '@/shared/lib/locale'

export interface CreditOffer {
  /** Free confirmations available now, already localized. */
  count: string
  /** Price of one confirmation after them, e.g. "2.00 ج.م" / "2.00 EGP". */
  price: string
}

/**
 * The free-credit offer shown on the setup and success screens, from the
 * same cached balance the rest of the app reads. `offer` stays null until
 * it has loaded, so no screen ever renders a placeholder "0".
 */
export function useCreditOffer() {
  const locale = useLocale() as SupportedLocale
  const { summary, isLoading } = useBillingSummary()

  if (!summary) return { offer: null, isLoading }

  const { amount, currency } = formatMoneyParts(
    summary.price.unitPriceMinor,
    summary.price.currency,
    locale
  )
  const offer: CreditOffer = {
    count: formatCredits(summary.availableCredits, locale),
    // Intl ends the Arabic pound with a period ("ج.م."); drop it mid-sentence.
    price: `${amount} ${currency.replace(/\.$/, '')}`,
  }
  return { offer, isLoading }
}
