'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { akChoiceSurface, AkChoiceGroup } from '@/shared/ui'
import { formatCredits, formatMoney } from '../../domain/billingFormatters'
import type { CreditPackage } from '../../domain/creditPackages'

interface CreditPackageTilesProps {
  packages: CreditPackage[]
  selected: number | null
  currency: string
  disabled: boolean
  onSelect: (credits: number) => void
}

/**
 * The preset amounts as radio tiles. A typed amount that is not a preset
 * leaves none checked; the first tile then keeps the group's tab stop.
 */
export function CreditPackageTiles({
  packages,
  selected,
  currency,
  disabled,
  onSelect,
}: CreditPackageTilesProps) {
  const t = useTranslations('billing.purchase')
  const { locale } = useLocaleInfo()

  if (packages.length === 0) return null

  return (
    <AkChoiceGroup
      aria-label={t('chooseAmount')}
      className="grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {packages.map((item, index) => {
        const checked = item.credits === selected
        const isTabStop = checked || (selected === null && index === 0)
        return (
          <button
            key={item.credits}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={isTabStop ? 0 : -1}
            disabled={disabled}
            onClick={() => onSelect(item.credits)}
            className={cn(
              'ak-focus rounded-ak-card text-ink relative flex cursor-pointer flex-col items-start gap-0.5 border p-4 text-start disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-colors motion-safe:duration-150',
              akChoiceSurface(checked)
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'bg-surface-raised absolute end-3.5 top-3.5 grid size-4.5 place-items-center rounded-full border-[1.5px]',
                checked ? 'border-brand' : 'border-control-border'
              )}
            >
              {checked && <span className="bg-brand size-2 rounded-full" />}
            </span>
            <span
              dir="ltr"
              className="text-[1.375rem] leading-7.5 font-semibold tabular-nums"
            >
              {formatCredits(item.credits, locale)}
            </span>
            <span className="text-ak-caption text-ink-muted">{t('unit')}</span>
            <bdi className="text-ak-caption mt-2 font-semibold tabular-nums">
              {formatMoney(item.totalMinor, currency, locale)}
            </bdi>
          </button>
        )
      })}
    </AkChoiceGroup>
  )
}
