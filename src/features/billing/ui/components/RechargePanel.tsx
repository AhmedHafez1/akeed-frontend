'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { akCard } from '@/shared/ui'
import { formatCredits } from '../../domain/billingFormatters'
import type { useBillingPage } from '../../domain/useBillingPage'
import { CreditPackageTiles } from './CreditPackageTiles'
import { QuantityStepper } from './QuantityStepper'

interface RechargePanelProps {
  state: ReturnType<typeof useBillingPage>
}

/**
 * Choosing the amount: the preset tiles, or any other amount through the
 * stepper. Both edit the one quantity the summary card prices.
 */
export function RechargePanel({ state }: RechargePanelProps) {
  const t = useTranslations('billing.purchase')
  const { locale } = useLocaleInfo()
  const headingId = useId()
  const quantityId = useId()
  const rulesId = useId()
  const { summary } = state
  if (!summary) return null

  const controlsDisabled = !state.canPurchase || state.isLocked
  const range = {
    min: formatCredits(summary.range.min, locale),
    max: formatCredits(summary.range.max, locale),
    step: formatCredits(summary.range.step, locale),
  }

  return (
    <section className={akCard} aria-labelledby={headingId}>
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <h2 id={headingId} className="text-ak-section text-ink">
          {t('title')}
        </h2>
        <p className="text-ak-caption text-ink-muted mt-0.5">
          {t('description')}
        </p>
      </div>

      <div className="flex flex-col gap-5 px-4 pb-4 sm:px-6 sm:pb-6">
        <CreditPackageTiles
          packages={state.packages}
          selected={state.selectedPackage}
          currency={summary.price.currency}
          disabled={controlsDisabled}
          onSelect={state.selectPackage}
        />

        <div className="border-line flex flex-col gap-2 border-t pt-5">
          <label
            htmlFor={quantityId}
            className="text-ak-caption text-ink font-semibold"
          >
            {t('customLabel')}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper
              id={quantityId}
              value={state.quantityInput}
              onChange={state.setQuantityInput}
              onStep={state.adjustQuantity}
              disabled={controlsDisabled}
              invalid={!!state.quantityError}
              describedBy={rulesId}
              decreaseLabel={t('decrease')}
              increaseLabel={t('increase')}
            />
            <span id={rulesId} className="text-ak-caption text-ink-muted">
              {t('rules', range)}
            </span>
          </div>
          {state.quantityError && (
            <p
              role="alert"
              className="text-ak-caption text-ak-warning font-semibold"
            >
              {t(`errors.${state.quantityError}`, range)}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
