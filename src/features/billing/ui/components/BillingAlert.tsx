'use client'

import { AlertCircle, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { resolveBalanceState } from '../../domain/balanceState'
import { formatCredits } from '../../domain/billingFormatters'
import type { CreditSummary } from '../../domain/billing.types'

/**
 * The one banner under the balance card, for a balance that needs attention:
 * a warning while it is low, a danger once messages have stopped. A healthy
 * balance shows nothing here, because the card's pill already says so.
 */
export function BillingAlert({ summary }: { summary: CreditSummary }) {
  const t = useTranslations('billing.alerts')
  const { locale } = useLocaleInfo()
  const { state, tone } = resolveBalanceState(summary)
  if (state === 'healthy') return null

  const isWarning = tone === 'warning'
  const Icon = isWarning ? AlertTriangle : AlertCircle
  const count =
    state === 'debt' ? summary.debtCredits : summary.availableCredits

  return (
    <div
      role={isWarning ? 'status' : 'alert'}
      className={cn(
        'rounded-ak-card text-ak-body flex items-start gap-2.5 border px-4 py-3',
        isWarning
          ? 'border-ak-warning-line bg-ak-warning-soft text-ak-warning'
          : 'border-ak-danger bg-ak-danger-soft text-ak-danger'
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p className="flex min-w-0 flex-col">
        <span className="font-bold">
          {t(`${state}Title`, {
            count,
            formatted: formatCredits(count, locale),
          })}
        </span>
        <span>{t(`${state}Description`)}</span>
      </p>
    </div>
  )
}
