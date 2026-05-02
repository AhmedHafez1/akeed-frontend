import { Building2, Rocket, Sprout, Star, Zap, type LucideIcon } from 'lucide-react'
import type { Tier } from '@/features/marketing/model/tier.model'
import {
  LandingIconBadge,
  landingCardClass,
} from '@/features/marketing/ui/components/LandingPrimitives'
import {
  getPricingFeatureKey,
  PRICING_FEATURE_INDICES_BY_PLAN,
} from '@/shared/config/pricing'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface PricingPlanCardProps {
  tier: Tier
  t: (key: string) => string
  isRTL: boolean
  onSelect: () => void
}

const tierIcons: Record<string, LucideIcon> = {
  starter: Sprout,
  basic: Zap,
  pro: Rocket,
  business: Building2,
}

export function PricingPlanCard({
  tier,
  t,
  isRTL,
  onSelect,
}: PricingPlanCardProps) {
  const isPopular = tier.key === 'basic'
  const isBusiness = tier.key === 'business'
  const Icon = tierIcons[tier.key] ?? Sprout

  const featureKeys = (
    PRICING_FEATURE_INDICES_BY_PLAN[tier.key] ??
    PRICING_FEATURE_INDICES_BY_PLAN.starter
  ).map((index) =>
    getPricingFeatureKey(tier.key, index)
  )

  const priceLabel = tier.isFree ? t('free') : t(`${tier.key}_price`)
  const subtitle = t(`${tier.key}_subtitle`)
  const ctaLabel = t(`${tier.key}_cta`)

  return (
    <article
      className={cn(
        landingCardClass,
        'flex h-full min-h-115 flex-col overflow-visible text-left',
        isPopular
          ? 'border-emerald-500/60 bg-linear-to-b from-emerald-50 to-white shadow-[0_22px_40px_rgba(16,185,129,0.18)]'
          : '',
        isBusiness
          ? 'border-slate-300 bg-linear-to-b from-slate-100 to-white shadow-[0_18px_34px_rgba(15,23,42,0.12)]'
          : '',
        isRTL ? 'text-right' : 'text-left'
      )}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-4xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-[0_3px_8px_rgba(16,185,129,0.24)]',
              isRTL
                ? 'py-1 tracking-normal sm:text-sm'
                : 'py-2 tracking-normal uppercase'
            )}
          >
            <Star className="h-4 w-4 fill-current" />
            {t('most_popular')}
          </span>
        </div>
      )}

      <div className="mb-6 border-b border-slate-200/80 pb-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-[1.55rem] leading-tight font-semibold tracking-[-0.04em] text-slate-900">
              {t(`tiers.${tier.key}`)}
            </h3>
            <p className="mt-2 text-xs text-slate-600">{subtitle}</p>
          </div>
          <LandingIconBadge
            icon={Icon}
            className="h-14 w-14 [&_svg]:h-7 [&_svg]:w-7"
            tone="slate"
          />
        </div>
      </div>

      <div className="mb-6 border-b border-slate-200/80 pb-6">
        <p
          className={cn(
            'text-xs font-semibold text-slate-400',
            isRTL ? 'tracking-normal' : 'tracking-[0.18em] uppercase'
          )}
        >
          {tier.isFree ? t('without_price') : t('total_price')}
        </p>

        <p
          className={cn(
            'mt-3 text-4xl leading-none font-bold tracking-[-0.04em]',
            tier.isFree ? 'text-emerald-600' : 'text-slate-900'
          )}
        >
          {priceLabel}
        </p>
      </div>

      <div className="mb-6 border-b border-slate-200/80 pb-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {t('plan_features')}
        </p>
        <ul className="space-y-2">
          {featureKeys.map((key) => (
            <li key={key} className="text-sm text-slate-700">
              • {t(key)}
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={onSelect}
        variant="outline"
        className={cn(
          'mt-auto h-14 w-full rounded-2xl border text-base font-semibold shadow-none',
          isPopular
            ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white'
            : isBusiness
              ? 'border-slate-700 bg-slate-700 text-white hover:bg-slate-800 hover:text-white'
              : 'border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700'
        )}
      >
        {ctaLabel}
      </Button>
    </article>
  )
}
