import { Check, Zap } from 'lucide-react'
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
  const usageValue = tier.isFree
    ? t('free')
    : `${tier.perOrder} ${t('currency')}`

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
        isPopular
          ? 'border-emerald-400 shadow-md ring-2 ring-emerald-100'
          : 'border-emerald-100 shadow-sm hover:border-emerald-200'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-md">
            <Zap className="h-3 w-3" />
            {t('most_popular')}
          </span>
        </div>
      )}

      <div className="mb-6 border-b border-slate-100 pb-6 text-center">
        <h3 className="mb-1 text-xl font-bold text-slate-900">
          {t(`tiers.${tier.key}`)}
        </h3>
        <p className="text-sm text-slate-500">
          {tier.ordersDisplay} {t('orders_label')}
        </p>
        <p className="mt-2 text-xs font-medium text-slate-400">
          {t(`${tier.key}_note`)}
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-center">
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
        <p className="mt-3 text-sm font-semibold text-slate-600">
          {tier.isFree
            ? t('free_badge')
            : `${tier.ordersDisplay} ${t('orders_label')}`}
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">
              {t('price_per_order')}
            </span>
            <span className="text-base font-semibold text-slate-900">
              {usageValue}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <Check className="h-4 w-4 text-emerald-600" />
          {t('check_1')}
        </div>
        <div className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <Check className="h-4 w-4 text-emerald-600" />
          {t('check_2')}
        </div>
        <div className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <Check className="h-4 w-4 text-emerald-600" />
          {t('check_3')}
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
