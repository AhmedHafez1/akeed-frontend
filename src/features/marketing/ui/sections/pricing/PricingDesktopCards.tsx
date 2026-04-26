import type { Tier } from '@/features/marketing/model/tier.model'
import { PricingPlanCard } from './PricingPlanCard'

interface PricingDesktopCardsProps {
  tiers: Tier[]
  t: (key: string) => string
  onCtaClick: () => void
  isRTL: boolean
}

export function PricingDesktopCards({
  tiers,
  t,
  onCtaClick,
  isRTL,
}: PricingDesktopCardsProps) {
  return (
    <div>
      <div className="mx-auto grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
        {tiers.map((tier) => (
          <PricingPlanCard
            key={tier.key}
            tier={tier}
            t={t}
            isRTL={isRTL}
            onSelect={onCtaClick}
          />
        ))}
      </div>
    </div>
  )
}
