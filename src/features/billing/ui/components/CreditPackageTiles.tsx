'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { formatCredits, formatMoney } from '../../domain/billingFormatters'
import type { CreditPackage } from '../../domain/creditPackages'

interface CreditPackageTilesProps {
  packages: CreditPackage[]
  selected: number | null
  unitPriceMinor: number
  currency: string
  disabled: boolean
  onSelect: (credits: number) => void
}

export function CreditPackageTiles({
  packages,
  selected,
  unitPriceMinor,
  currency,
  disabled,
  onSelect,
}: CreditPackageTilesProps) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()

  if (packages.length === 0) return null

  return (
    <div
      role="radiogroup"
      aria-label={t('packages.stepLabel')}
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {packages.map((item) => {
        const isSelected = item.credits === selected
        return (
          <button
            key={item.credits}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onSelect(item.credits)}
            className={cn(
              'rounded-card focus-visible:ring-ring relative border p-4 text-center transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60',
              isSelected
                ? 'border-primary ring-primary shadow-card ring-1'
                : 'border-border hover:border-primary-border'
            )}
          >
            {isSelected && (
              <span
                className="bg-primary absolute end-3 top-3 size-2 rounded-full"
                aria-hidden
              />
            )}
            <span
              dir="ltr"
              className="text-foreground block text-2xl font-bold tabular-nums"
            >
              {formatCredits(item.credits, locale)}
            </span>
            <span className="text-muted-foreground text-caption block">
              {t('packages.unit')}
            </span>
            <span className="text-foreground mt-2 block font-semibold">
              {formatMoney(item.totalMinor, currency, locale)}
            </span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
              {t('packages.perCredit', {
                amount: formatMoney(unitPriceMinor, currency, locale),
              })}
            </span>
          </button>
        )
      })}
    </div>
  )
}
