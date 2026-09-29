'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatCredits } from '@/shared/lib/money'
import { withLocale, type SupportedLocale } from '@/shared/lib/locale'
import { Skeleton } from '@/shared/ui'
import { useBillingSummary } from '../domain/useBillingSummary'

/**
 * "الرصيد 30 رسالة" in the standalone top bar, linking to billing. A skeleton
 * while the balance loads (never a placeholder "0"); nothing if it failed.
 * Below 640px only the number shows, with the full phrase as its label.
 */
export function CreditBalanceChip() {
  const t = useTranslations('billing.balanceChip')
  const locale = useLocale() as SupportedLocale
  const { summary, isLoading, error } = useBillingSummary()

  if (!summary) {
    return isLoading && !error ? (
      <Skeleton aria-hidden="true" className="h-9 w-28 rounded-full" />
    ) : null
  }

  const count = formatCredits(summary.availableCredits, locale)
  const label = t('label', { count })

  return (
    <Link
      href={withLocale('/billing', locale)}
      aria-label={label}
      className="bg-muted text-foreground hover:bg-muted/70 focus-visible:ring-ring inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
      <span aria-hidden="true" className="hidden sm:inline">
        {t.rich('value', {
          count,
          strong: (chunks) => (
            <strong className="font-semibold">{chunks}</strong>
          ),
        })}
      </span>
      <strong aria-hidden="true" className="font-semibold sm:hidden">
        {count}
      </strong>
    </Link>
  )
}
