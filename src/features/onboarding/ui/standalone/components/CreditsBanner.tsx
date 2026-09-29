'use client'

import { CircleCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/shared/ui'
import { useCreditOffer } from '@/features/onboarding/hooks/useCreditOffer'

/**
 * "You have 30 free confirmation messages": the free grant and the price
 * after it, once, beside the form that spends nothing yet. A skeleton holds
 * the space while the balance loads; nothing shows if it cannot load.
 */
export function CreditsBanner() {
  const t = useTranslations('standaloneOnboarding.store.credits')
  const { offer, isLoading } = useCreditOffer()

  if (!offer) {
    return isLoading ? (
      <Skeleton
        aria-hidden="true"
        data-testid="credits-banner-skeleton"
        className="rounded-panel h-[76px] w-full"
      />
    ) : null
  }

  return (
    <div
      role="status"
      className="border-brand-line bg-brand-soft rounded-panel flex items-start gap-3 border p-4 text-start"
    >
      <CircleCheck
        aria-hidden="true"
        className="text-brand-ink mt-0.5 size-5 shrink-0"
      />
      <div className="space-y-0.5">
        <p className="text-ink text-sm font-semibold">
          {t('title', { count: offer.count })}
        </p>
        <p className="text-ink-muted text-sm">
          {t('body', { price: offer.price })}
        </p>
      </div>
    </div>
  )
}
