'use client'

import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useState, type CSSProperties } from 'react'
import {
  CREDIT_CURRENCY,
  CREDIT_PURCHASE_MAX,
  CREDIT_PURCHASE_MIN,
  CREDIT_PURCHASE_STEP,
  CREDIT_UNIT_PRICE_MINOR,
} from '@/shared/config/pricing'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatCredits, formatMoneyParts } from '@/shared/lib/money'

const PREFERRED_DEFAULT = 500

/*
 * Snapped onto the purchasable range, so a config change can never start the
 * slider on an amount checkout would reject.
 */
function defaultCredits() {
  const clamped = Math.min(
    CREDIT_PURCHASE_MAX,
    Math.max(CREDIT_PURCHASE_MIN, PREFERRED_DEFAULT)
  )
  const steps = Math.round(
    (clamped - CREDIT_PURCHASE_MIN) / CREDIT_PURCHASE_STEP
  )
  return CREDIT_PURCHASE_MIN + steps * CREDIT_PURCHASE_STEP
}

/**
 * The one interactive element on the pricing card: pick an amount, see what it
 * costs and roughly how many orders it covers.
 *
 * The orders figure is a range on purpose. Billing meters messages, not orders:
 * an order the customer confirms first time costs one credit, one that needs a
 * follow-up costs two. Quoting a single "orders" number would overstate it.
 */
export function CreditSlider() {
  const t = useTranslations('pricing_credits')
  const { locale } = useLocaleInfo()
  const shouldReduceMotion = useReducedMotion()
  const labelId = useId()

  const [credits, setCredits] = useState(defaultCredits)
  const totalMinor = credits * CREDIT_UNIT_PRICE_MINOR

  const spring = useSpring(totalMinor, { stiffness: 180, damping: 28 })
  const animatedAmount = useTransform(
    spring,
    (value) =>
      formatMoneyParts(Math.round(value), CREDIT_CURRENCY, locale).amount
  )

  useEffect(() => {
    if (shouldReduceMotion) {
      spring.jump(totalMinor)
    } else {
      spring.set(totalMinor)
    }
  }, [spring, totalMinor, shouldReduceMotion])

  const total = formatMoneyParts(totalMinor, CREDIT_CURRENCY, locale)
  const range = CREDIT_PURCHASE_MAX - CREDIT_PURCHASE_MIN
  const fill = range > 0 ? ((credits - CREDIT_PURCHASE_MIN) / range) * 100 : 0
  const creditsLabel = t('slider_value', {
    count: formatCredits(credits, locale),
  })
  const ordersLabel = t('calculator_orders', {
    low: formatCredits(Math.ceil(credits / 2), locale),
    high: formatCredits(credits, locale),
  })

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p id={labelId} className="text-base font-semibold text-slate-100">
          {t('slider_label')}
        </p>
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-white tabular-nums ring-1 ring-emerald-400/50">
          {creditsLabel}
        </span>
      </div>

      <div dir="ltr" className="mt-6">
        <input
          type="range"
          className="akeed-range"
          min={CREDIT_PURCHASE_MIN}
          max={CREDIT_PURCHASE_MAX}
          step={CREDIT_PURCHASE_STEP}
          value={credits}
          onChange={(event) => setCredits(Number(event.target.value))}
          aria-labelledby={labelId}
          aria-valuetext={creditsLabel}
          style={{ '--fill': `${fill}%` } as CSSProperties}
        />
        <div className="mt-3 flex justify-between text-xs text-slate-500 tabular-nums">
          <span>{formatCredits(CREDIT_PURCHASE_MIN, locale)}</span>
          <span>{formatCredits(CREDIT_PURCHASE_MAX, locale)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div>
          <p className="text-sm text-slate-400">{t('total_label')}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <motion.span
              dir="ltr"
              aria-hidden
              className="text-3xl font-bold text-white tabular-nums sm:text-4xl"
            >
              {animatedAmount}
            </motion.span>
            <span aria-hidden className="text-lg text-slate-400">
              {total.currency}
            </span>
          </p>
        </div>

        <span
          aria-hidden
          className="hidden h-10 w-px self-center bg-white/10 sm:block"
        />

        <p className="text-sm text-slate-400 sm:text-base">{ordersLabel}</p>

        {/* One announcement per settled value, not one per animation frame. */}
        <p className="sr-only" aria-live="polite">
          {`${creditsLabel} = ${total.amount} ${total.currency}. ${ordersLabel}`}
        </p>
      </div>
    </div>
  )
}
