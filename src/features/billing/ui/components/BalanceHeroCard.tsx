'use client'

import { Plus, WalletCards } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Button } from '@/shared/ui'
import {
  formatCredits,
  formatMoneyFromCredits,
} from '../../domain/billingFormatters'
import type { CreditSummary } from '../../domain/billing.types'

interface BalanceHeroCardProps {
  summary: CreditSummary
  onBuyClick: () => void
}

export function BalanceHeroCard({ summary, onBuyClick }: BalanceHeroCardProps) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()

  const equivalent = formatMoneyFromCredits(
    summary.availableCredits,
    summary.price.unitPriceMinor,
    summary.price.currency,
    locale
  )

  return (
    <section
      /*
       * The gradient is written from the brand tokens rather than raw emerald
       * stops so it tracks `--primary` if the brand ramp is ever retuned.
       *
       * DOM order is the layout: the balance comes first so it sits at the
       * start edge (right in Arabic, left in English) and the account controls
       * fall to the far side, without a single RTL conditional.
       */
      className="rounded-panel shadow-brand flex flex-col gap-6 overflow-hidden bg-[linear-gradient(to_bottom_left,var(--primary-subtle-foreground),var(--primary))] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <div>
          <p className="text-sm font-medium text-white/75">
            {t('hero.available')}
          </p>
          <p className="mt-1 flex flex-wrap items-baseline gap-2">
            <span
              dir="ltr"
              className="text-5xl font-bold tabular-nums sm:text-6xl"
            >
              {formatCredits(summary.availableCredits, locale)}
            </span>
            <span className="text-sm font-medium text-white/75">
              {t('hero.unit')}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4">
        <Button
          onClick={onBuyClick}
          className="text-primary hover:text-primary-hover bg-white p-6 text-lg shadow-none hover:bg-white"
        >
          {t('hero.buyCredits')}
        </Button>
      </div>
    </section>
  )
}
