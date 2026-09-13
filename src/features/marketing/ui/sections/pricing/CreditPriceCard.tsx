'use client'

import { Gift } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import {
  landingCardClass,
  landingCardGlowClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import {
  CREDIT_CURRENCY,
  CREDIT_FREE_GRANT,
  CREDIT_PURCHASE_MAX,
  CREDIT_PURCHASE_MIN,
  CREDIT_PURCHASE_STEP,
  CREDIT_UNIT_PRICE_MINOR,
} from '@/shared/config/pricing'
import { formatCredits, formatMoney } from '@/shared/lib/money'
import { cn } from '@/shared/lib/utils'

export function CreditPriceCard() {
  const t = useTranslations('pricing_credits')
  const { locale, isRTL, targets } = useAcquisition()

  const unitPrice = formatMoney(
    CREDIT_UNIT_PRICE_MINOR,
    CREDIT_CURRENCY,
    locale
  )

  return (
    <article
      className={cn(
        landingCardClass,
        'flex flex-col gap-6',
        isRTL ? 'text-right' : 'text-left'
      )}
    >
      <div className={landingCardGlowClass} aria-hidden />

      <div className="relative">
        <p className="text-muted-foreground text-xs font-semibold">
          {t('unit_price_label')}
        </p>
        {/*
         * The amount is forced LTR so Arabic punctuation does not land on the
         * wrong side of the digits. Formatting comes from shared/lib/money, so
         * this renders exactly like the in-app balance.
         */}
        <p
          dir="ltr"
          className={cn(
            'mt-3 flex flex-wrap items-baseline gap-x-2',
            isRTL ? 'justify-end' : 'justify-start'
          )}
        >
          <span className="text-primary text-4xl leading-none font-bold">
            {unitPrice}
          </span>
        </p>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {t('unit_price_note')}
        </p>
      </div>

      <div className="border-border relative flex items-start gap-3 border-t pt-6">
        <Gift className="text-primary mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-foreground text-sm font-semibold">
            {t('grant_title', {
              count: formatCredits(CREDIT_FREE_GRANT, locale),
            })}
          </p>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {t('grant_body')}
          </p>
        </div>
      </div>

      <p className="text-muted-foreground relative text-sm leading-6">
        {t('purchase_rules', {
          min: formatCredits(CREDIT_PURCHASE_MIN, locale),
          max: formatCredits(CREDIT_PURCHASE_MAX, locale),
          step: formatCredits(CREDIT_PURCHASE_STEP, locale),
        })}
      </p>

      <AcquisitionCta
        target={targets.standalone}
        label={t('cta')}
        note={t('cta_note')}
        variant="primary"
        className="relative mt-auto w-full"
      />
    </article>
  )
}
