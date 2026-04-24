import { Zap } from 'lucide-react'
import type { Tier } from '@/features/marketing/model/tier.model'
import { Button } from '@/shared/ui/button'

interface PricingPlanCardProps {
  tier: Tier
  t: (key: string) => string
  onSelect: () => void
}

export function PricingPlanCard({ tier, t, onSelect }: PricingPlanCardProps) {
  const isPopular = tier.key === 'pro'
  const planValue = tier.isFree ? t('free') : `${tier.price} ${t('currency')}`

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
        isPopular
          ? 'border-emerald-400 shadow-md ring-2 ring-emerald-100'
          : 'border-emerald-100 shadow-sm hover:border-emerald-200'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md">
            <Zap className="h-3 w-3" />
            {t('most_popular')}
          </span>
        </div>
      )}

      <div className="mb-6 border-b border-slate-100 pb-6 text-center">
        <h3 className="mb-1 text-xl font-bold text-slate-900">
          {t(`tiers.${tier.key}`)}
        </h3>
        <p className="mt-2 text-xs font-medium text-slate-400">
          {t(`${tier.key}_note`)}
        </p>
      </div>

      <div className="mb-6 p-4 text-center">
        <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
          {t('total_price')}
        </p>
        <div className="mt-3 flex items-end justify-center gap-1">
          <span
            className={`text-4xl leading-none font-black ${
              tier.isFree ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {planValue}
          </span>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600"></p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="items-ce flex gap-2 text-sm leading-6 text-slate-600">
          <span>
            {tier.isFree
              ? t('free_badge')
              : `${tier.ordersDisplay} ${t('orders_label')}`}
          </span>
        </div>
      </div>

      <Button
        onClick={onSelect}
        className={`mt-auto h-12 w-full rounded-xl font-bold ${
          isPopular
            ? 'bg-orange-500 text-white hover:bg-orange-600'
            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
        }`}
      >
        {t('cta_recharge')}
      </Button>
    </article>
  )
}
