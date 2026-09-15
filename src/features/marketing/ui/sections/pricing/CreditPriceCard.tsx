'use client'

import { ArrowRight, Gift } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import {
  CREDIT_CURRENCY,
  CREDIT_FREE_GRANT,
  CREDIT_UNIT_PRICE_MINOR,
} from '@/shared/config/pricing'
import { formatCredits, formatMoneyParts } from '@/shared/lib/money'
import { CreditSlider } from './CreditSlider'

/**
 * The ink panel: the one focal point of the pricing section.
 *
 * Dark on an otherwise white band, reusing the header's `slate-950`, so the
 * price reads as the section's single statement instead of one card among
 * five. Emerald is the only accent, and the only decoration is a corner glow.
 */
export function CreditPriceCard() {
  const t = useTranslations('pricing_credits')
  const { locale, targets } = useAcquisition()

  const price = formatMoneyParts(
    CREDIT_UNIT_PRICE_MINOR,
    CREDIT_CURRENCY,
    locale
  )

  return (
    <div className="relative isolate overflow-hidden bg-slate-950 p-8 sm:p-10 lg:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -end-24 -z-10 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl"
      />

      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-emerald-400/50">
        <Gift className="h-4 w-4 text-emerald-400" />
        {t('grant_pill', { count: formatCredits(CREDIT_FREE_GRANT, locale) })}
      </span>

      {/*
       * The amount is forced LTR so Arabic punctuation does not land on the
       * wrong side of the digits. Formatting comes from shared/lib/money, so
       * this renders exactly like the in-app balance.
       */}
      <p className="mt-8 flex items-baseline gap-3">
        <span
          dir="ltr"
          className="text-6xl leading-none font-extrabold text-white tabular-nums sm:text-7xl"
        >
          {price.amount}
        </span>
        <span className="text-2xl font-semibold text-slate-400">
          {price.currency}
        </span>
      </p>
      <p className="mt-3 text-base text-slate-400">{t('per_message')}</p>

      <div className="mt-8 border-t border-white/10 pt-8">
        <CreditSlider />
      </div>

      <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <AcquisitionCta
          target={targets.standalone}
          label={t('cta')}
          variant="primary"
          className="h-14 gap-3 px-8 text-lg font-semibold"
          trailing={
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
          }
        />
        <p className="text-center text-sm text-slate-400 sm:text-start">
          {t('cta_note')}
        </p>
      </div>
    </div>
  )
}
