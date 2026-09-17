'use client'

import { Coins } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { useBillingSummary } from '../../domain/useBillingSummary'
import { formatCredits } from '../../domain/billingFormatters'

interface CreditsBadgeProps {
  className?: string
}

/**
 * Compact credit-balance pill for page headers (dashboard, verifications).
 * Mirrors the emerald count-pill already used in the verifications header so
 * the two badges read as one visual family.
 */
export function CreditsBadge({ className }: CreditsBadgeProps) {
  const t = useTranslations('billing')
  const { locale } = useLocaleInfo()
  const { summary, isLoading, error } = useBillingSummary()

  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'bg-border inline-block h-8 w-24 animate-pulse rounded-full',
          className
        )}
      />
    )
  }

  // Never let a billing hiccup break a page header — the Billing page is
  // where a real error state belongs.
  if (error || !summary || summary.status === 'not_provisioned') return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg bg-primary-subtle px-3 py-1.5 text-sm font-semibold text-primary-subtle-foreground tabular-nums',
        className
      )}
    >
      <Coins aria-hidden="true" className="h-4 w-4" />
      <span className="font-bold text-lg">{formatCredits(summary.availableCredits, locale)}</span> {t('badge.label')}
    </span>
  )
}
