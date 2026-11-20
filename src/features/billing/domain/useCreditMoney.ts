'use client'

import { useLocale } from 'next-intl'
import {
  CREDIT_CURRENCY,
  CREDIT_UNIT_PRICE_MINOR,
} from '@/shared/config/pricing'
import { creditsToMinor, formatBalance } from '@/shared/lib/balanceMoney'
import type { SupportedLocale } from '@/shared/lib/locale'
import { useBillingSummary } from './useBillingSummary'

/**
 * Displayed credits from any API, shown as money, for screens outside
 * billing (imports, dashboard, onboarding). The price comes from the billing
 * summary; until it loads, from the public pricing defaults, which match it.
 */
export function useCreditMoney() {
  const locale = useLocale() as SupportedLocale
  const { summary } = useBillingSummary()
  const unitPriceMinor =
    summary?.price.unitPriceMinor ?? CREDIT_UNIT_PRICE_MINOR
  const currency = summary?.price.currency ?? CREDIT_CURRENCY
  const toMinor = (credits: number) => creditsToMinor(credits, unitPriceMinor)
  return {
    unitPriceMinor,
    currency,
    toMinor,
    /** `EGP 150.5` for 301 displayed credits at EGP 0.50. */
    format: (credits: number) =>
      formatBalance(toMinor(credits), currency, locale),
  }
}
