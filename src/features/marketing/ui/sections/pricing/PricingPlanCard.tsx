import {
  Building2,
  ChartColumnIncreasing,
  Rocket,
  Sprout,
  Star,
  type LucideIcon,
} from 'lucide-react'
import type { Tier } from '@/features/marketing/model/tier.model'
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
  growth: ChartColumnIncreasing,
  pro: Rocket,
  scale: Building2,
}

export function PricingPlanCard({
  tier,
  t,
  isRTL,
  onSelect,
}: PricingPlanCardProps) {
  const isPopular = tier.key === 'pro'
  const Icon = tierIcons[tier.key] ?? Sprout
  const verificationLabel = tier.isFree
    ? t('free_badge')
    : `${tier.ordersDisplay} ${t('orders_label')}`

  return (
    <article
      className={cn(
        'relative flex h-full min-h-115 flex-col rounded-[30px] border p-8 text-center transition-all duration-300 hover:-translate-y-1',
        'border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]'
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

      <div className="mb-8 border-b border-slate-200/80 pb-8">
        <div className="mb-6 flex justify-center">
          <div className="flex h-18 w-18 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Icon className="h-9 w-9" />
          </div>
        </div>

        <h3 className="text-[1.8rem] leading-tight font-semibold tracking-[-0.055em] text-slate-800 uppercase">
          {t(`tiers.${tier.key}`)}
        </h3>
        <p className="mt-3 text-[1rem] text-slate-500">
          {t(`${tier.key}_note`)}
        </p>
      </div>

      <div className="mb-8 border-b border-slate-200/80 pb-8">
        <p
          className={cn(
            'text-sm font-semibold',
            isRTL ? 'tracking-normal' : 'tracking-[0.2em] uppercase',
            'text-slate-400'
          )}
        >
          {tier.isFree ? t('without_price') : t('total_price')}
        </p>

        {tier.isFree ? (
          <div className="mt-5 text-[clamp(1.5rem,7vw,3.3rem)] leading-none font-bold text-emerald-600">
            {t('free')}
          </div>
        ) : (
          <div
            className={cn(
              'mt-5 flex flex-wrap items-end justify-center gap-x-3 gap-y-1 leading-none font-bold tracking-[-0.08em]',
              'text-slate-500'
            )}
          >
            <span className="text-[clamp(1.5rem,7vw,3.3rem)]">
              {tier.price}
            </span>
            <span className="text-[clamp(1rem,5vw,2.5rem)] whitespace-nowrap">
              {t('currency')}
            </span>
          </div>
        )}
      </div>

      <p className="mb-8 text-[1.5rem] leading-8 font-bold text-slate-950">
        {verificationLabel}
      </p>

      <Button
        onClick={onSelect}
        variant="outline"
        className={cn(
          'mt-auto h-14 w-full rounded-2xl border text-base font-semibold shadow-none',
          isPopular
            ? 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600 hover:text-white'
            : 'border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700'
        )}
      >
        {t('cta_recharge')}
      </Button>
    </article>
  )
}
