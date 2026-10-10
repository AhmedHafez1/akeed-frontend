import {
  CREDIT_CURRENCY,
  CREDIT_FREE_GRANT,
  CREDIT_UNIT_PRICE_MINOR,
} from '@/shared/config/pricing'
import type { SupportedLocale } from '@/shared/lib/locale'
import { formatCredits, formatMoneyParts } from '@/shared/lib/money'

export interface SignupOffer {
  /** Free WhatsApp messages on a new Akeed account. */
  count: number
  formattedCount: string
  /** Price of one message after them, e.g. "2.00 ج.م". */
  price: string
}

/**
 * The two numbers signup states, from the shared pricing config and never
 * from the copy.
 */
export function getSignupOffer(locale: SupportedLocale): SignupOffer {
  const { amount, currency } = formatMoneyParts(
    CREDIT_UNIT_PRICE_MINOR,
    CREDIT_CURRENCY,
    locale
  )

  return {
    count: CREDIT_FREE_GRANT,
    formattedCount: formatCredits(CREDIT_FREE_GRANT, locale),
    // Same shape as onboarding's credit offer; Intl ends the Arabic pound
    // with a period, which reads wrong mid-sentence.
    price: `${amount} ${currency.replace(/\.$/, '')}`,
  }
}
