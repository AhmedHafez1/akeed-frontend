import type { Tier } from '@/features/marketing/model/tier.model'
import { PricingPlanCard } from './PricingPlanCard'

interface PricingDesktopCardsProps {
  tiers: Tier[]
  t: (key: string) => string
  onCtaClick: () => void
}

export function PricingDesktopCards({
  tiers,
  t,
  onCtaClick,
}: PricingDesktopCardsProps) {
  return (
    <div className="hidden lg:block">
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-5">
        {tiers.map((tier) => (
          <PricingPlanCard
            key={tier.key}
            tier={tier}
            t={t}
            onSelect={onCtaClick}
          />
        ))}
      </div>
    </div>
  )
}
