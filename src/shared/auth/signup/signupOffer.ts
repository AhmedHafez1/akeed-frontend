import {
  CREDIT_CURRENCY,
  CREDIT_FREE_MESSAGES,
  CREDIT_MESSAGE_PRICE_MINOR,
} from '@/shared/config/pricing'
import { formatBalance } from '@/shared/lib/balanceMoney'
import type { SupportedLocale } from '@/shared/lib/locale'
import { formatCredits } from '@/shared/lib/money'

export interface SignupOffer {
  /** Free WhatsApp messages on a new Akeed account. */
  count: number
  formattedCount: string
  /** Price of one message after them, e.g. "1 ج.م" or "EGP 1". */
  price: string
}

/**
 * The two numbers signup states, from the shared pricing config and never
 * from the copy.
 */
export function getSignupOffer(locale: SupportedLocale): SignupOffer {
  return {
    count: CREDIT_FREE_MESSAGES,
    formattedCount: formatCredits(CREDIT_FREE_MESSAGES, locale),
    // Same formatter as onboarding's offer and the in-app balance.
    price: formatBalance(CREDIT_MESSAGE_PRICE_MINOR, CREDIT_CURRENCY, locale),
  }
}
