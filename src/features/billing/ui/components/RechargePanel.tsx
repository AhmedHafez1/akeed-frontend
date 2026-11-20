'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { InfoHint, akCard } from '@/shared/ui'
import { formatMoney } from '../../domain/billingFormatters'
import { messagePrices } from '../../domain/messageCoverage'
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
  const { summary, amountRange } = state
  if (!summary || !amountRange) return null

  const controlsDisabled = !state.canPurchase || state.isLocked
  const pounds = (value: number) =>
    formatMoney(value * 100, summary.price.currency, locale)
  const range = {
    min: pounds(amountRange.min),
    max: pounds(amountRange.max),
    step: pounds(amountRange.step),
  }

  return (
    <section className={akCard} aria-labelledby={headingId}>
      <div className="flex items-center gap-1 px-4 py-4 sm:px-6 sm:py-5">
        <h2 id={headingId} className="text-ak-section text-ink">
          {t('title')}
        </h2>
        <InfoHint label={t('title')} content={t('description')} />
      </div>

      <div className="@container flex flex-col gap-5 px-4 pb-4 sm:px-6 sm:pb-6">
        <CreditPackageTiles
          packages={state.packages}
          selected={state.selectedPackage}
          currency={summary.price.currency}
          akeedMessagePriceMinor={messagePrices(summary.price).akeed}
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
              value={state.amountInput}
              onChange={state.setAmountInput}
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
