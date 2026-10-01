'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { formatCredits } from '../../domain/billingFormatters'

/**
 * Messages per day over the last 14 days, today's bar in the brand colour.
 * A shape, not a readout: it is hidden from assistive tech and on phones, and
 * the numbers themselves live in the stats row under it.
 */
export function DailyUsageBars({ daily }: { daily: number[] }) {
  const t = useTranslations('billing.balance')
  const { locale } = useLocaleInfo()
  const peak = Math.max(...daily, 1)
  const total = daily.reduce((sum, value) => sum + value, 0)

  return (
    <div aria-hidden="true" className="hidden w-65 sm:block">
      <div className="text-ak-caption text-ink-muted mb-2 flex justify-between">
        <span>{t('chartLabel')}</span>
        <span dir="ltr" className="text-ink font-semibold tabular-nums">
          {formatCredits(total, locale)}
        </span>
      </div>
      <div className="flex h-14 items-end gap-1">
        {daily.map((value, index) => (
          <span
            key={index}
            className={cn(
              'min-h-0.5 flex-1 rounded-[3px]',
              index === daily.length - 1 ? 'bg-brand' : 'bg-brand-line'
            )}
            style={{ height: `${(value / peak) * 100}%` }}
          />
        ))}
      </div>
      <div className="text-ak-caption text-ink-muted mt-1.5 flex justify-between">
        <span>{t('chartFrom')}</span>
        <span>{t('chartToday')}</span>
      </div>
    </div>
  )
}
