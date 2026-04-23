import type { Tier } from '@/features/marketing/model/tier.model'
import { PricingPlanCard } from './PricingPlanCard'

interface PricingMobileCardsProps {
  tiers: Tier[]
  t: (key: string) => string
  onCtaClick: () => void
}

export function PricingMobileCards({
  tiers,
  t,
  onCtaClick,
}: PricingMobileCardsProps) {
  return (
    <div className="space-y-4 lg:hidden">
      {tiers.map((tier) => (
        <PricingPlanCard
          key={tier.key}
          tier={tier}
          t={t}
          onSelect={onCtaClick}
        />
      ))}
    </div>
  )
}
