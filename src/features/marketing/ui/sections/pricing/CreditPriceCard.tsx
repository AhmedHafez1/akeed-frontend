'use client'

import { ArrowRight, Gift, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAcquisition } from '@/features/marketing/domain/useAcquisition'
import { AcquisitionCta } from '@/features/marketing/ui/components/AcquisitionCta'
import {
  CREDIT_CURRENCY,
  CREDIT_FREE_MESSAGES,
  CREDIT_MESSAGE_PRICE_MINOR,
  CREDIT_UNIT_PRICE_MINOR,
  CREDITS_PER_MESSAGE,
  OWN_NUMBER_CREDITS_PER_MESSAGE,
  OWN_NUMBER_MESSAGE_PRICE_MINOR,
} from '@/shared/config/pricing'
import {
  formatCredits,
  formatMoney,
  formatMoneyParts,
} from '@/shared/lib/money'
import { CreditSlider } from './CreditSlider'

/**
 * The ink panel: the one focal point of the pricing section.
 *
 * Dark on an otherwise white band, reusing the header's `ink-panel`, so the
 * price reads as the section's single statement instead of one card among
 * five. Emerald is the only accent, and the only decoration is a corner glow.
 */
interface CreditPriceCardProps {
  /** Add the own-number rate beside Akeed's, with Meta's separate charge. */
  showOwnNumber?: boolean
}

export function CreditPriceCard({
  showOwnNumber = false,
}: CreditPriceCardProps) {
  const t = useTranslations('pricing_credits')
  const { locale, targets } = useAcquisition()

  const price = formatMoneyParts(
    CREDIT_UNIT_PRICE_MINOR,
    CREDIT_CURRENCY,
    locale
  )

  return (
    <div className="bg-ink-panel relative isolate overflow-hidden p-8 sm:p-10 lg:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -end-24 -top-24 -z-10 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl"
      />

      <h3 className="text-xl font-bold text-white">{t('account_title')}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {t('account_audience')}
      </p>

      <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-emerald-400/50">
        <Gift className="h-4 w-4 text-emerald-400" />
        {t('grant_pill', {
          count: formatCredits(CREDIT_FREE_MESSAGES, locale),
        })}
      </span>

      {/*
       * The amount is forced LTR so Arabic punctuation does not land on the
       * wrong side of the digits. Formatting comes from shared/lib/money, so
       * this renders exactly like the in-app balance.
       */}
      <p className="mt-8 flex items-baseline gap-3">
        <span
          dir="ltr"
          className="text-6xl leading-none font-bold text-white tabular-nums sm:text-7xl"
        >
          {price.amount}
        </span>
        <span className="text-2xl font-semibold text-slate-400">
          {price.currency}
        </span>
      </p>
      <p className="mt-3 text-base text-slate-400">{t('per_credit')}</p>
      <p className="mt-1 text-base text-slate-400">
        {t('message_cost', {
          credits: formatCredits(CREDITS_PER_MESSAGE, locale),
          price: formatMoney(
            CREDIT_MESSAGE_PRICE_MINOR,
            CREDIT_CURRENCY,
            locale
          ),
        })}
      </p>

      {showOwnNumber && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-sm text-slate-400">
            {t('own_number.rates_heading')}
          </p>
          <dl className="mt-2.5 grid grid-cols-2 gap-4">
            <div className="border-s-2 border-white/20 ps-3">
              <dt className="text-sm text-slate-400">
                {t('own_number.from_akeed')}
              </dt>
              <dd className="mt-0.5 text-lg font-semibold text-white">
                <bdi>
                  {t('own_number.rate', {
                    credits: CREDITS_PER_MESSAGE,
                    price: formatMoney(
                      CREDIT_MESSAGE_PRICE_MINOR,
                      CREDIT_CURRENCY,
                      locale
                    ),
                  })}
                </bdi>
              </dd>
            </div>
            <div className="border-s-2 border-emerald-400 ps-3">
              <dt className="text-sm text-slate-400">
                {t('own_number.from_yours')}
              </dt>
              <dd className="mt-0.5 text-lg font-semibold text-white">
                <bdi>
                  {t('own_number.rate', {
                    credits: OWN_NUMBER_CREDITS_PER_MESSAGE,
                    price: formatMoney(
                      OWN_NUMBER_MESSAGE_PRICE_MINOR,
                      CREDIT_CURRENCY,
                      locale
                    ),
                  })}
                </bdi>
              </dd>
            </div>
          </dl>
          <p className="mt-3.5 text-[0.9375rem] leading-6 text-slate-100">
            {t('own_number.saving')}
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-slate-400">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('own_number.meta_note')}</span>
          </p>
        </div>
      )}

      <div className="mt-8 border-t border-white/10 pt-8">
        <CreditSlider showOwnNumber={showOwnNumber} />
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
