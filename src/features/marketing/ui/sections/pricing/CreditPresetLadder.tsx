'use client'

import { useTranslations } from 'next-intl'
import {
  CREDIT_CURRENCY,
  CREDIT_PRESETS,
  CREDIT_PURCHASE_MAX,
  CREDIT_PURCHASE_MIN,
  CREDIT_PURCHASE_STEP,
  CREDIT_UNIT_PRICE_MINOR,
} from '@/shared/config/pricing'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatCredits, formatMoney } from '@/shared/lib/money'
import { cn } from '@/shared/lib/utils'
import { landingInsetCardClass } from '@/features/marketing/ui/components/LandingPrimitives'

/*
 * Mirrors `derivePackages` in the billing feature: a preset that a config
 * change would make unpurchasable is dropped rather than advertised and then
 * rejected at checkout. The ladder itself is shared via shared/config/pricing,
 * so the two surfaces show the same sizes.
 */
function purchasablePresets() {
  return CREDIT_PRESETS.filter(
    (credits) =>
      credits >= CREDIT_PURCHASE_MIN &&
      credits <= CREDIT_PURCHASE_MAX &&
      credits % CREDIT_PURCHASE_STEP === 0
  )
}

export function CreditPresetLadder() {
  const t = useTranslations('pricing_credits')
  const { locale, isRTL } = useLocaleInfo()
  const presets = purchasablePresets()

  if (presets.length === 0) {
    return null
  }

  return (
    <div className={isRTL ? 'text-right' : 'text-left'}>
      <p className="text-foreground text-base font-semibold">
        {t('presets_title')}
      </p>
      <p className="text-muted-foreground mt-1 text-sm leading-6">
        {t('presets_note')}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {presets.map((credits) => (
          <div
            key={credits}
            className={cn(landingInsetCardClass, 'p-5 text-center')}
          >
            <p className="text-foreground text-lg font-bold" dir="ltr">
              {formatCredits(credits, locale)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t('presets_unit')}
            </p>
            <p className="text-primary mt-3 text-sm font-semibold" dir="ltr">
              {formatMoney(
                credits * CREDIT_UNIT_PRICE_MINOR,
                CREDIT_CURRENCY,
                locale
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
