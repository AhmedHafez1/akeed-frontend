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

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        isPopular
          ? 'border-emerald-400 shadow-md ring-2 ring-emerald-100'
          : 'border-slate-200 shadow-sm'
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

      <div className="mb-5 border-b border-slate-100 pb-5 text-center">
        <h3 className="mb-1 text-xl font-bold text-slate-800">
          {t(`tiers.${tier.key}`)}
        </h3>
        <p className="text-sm text-slate-500">
          {tier.ordersDisplay} {t('orders_label')}
        </p>
        <p className="mt-2 text-xs font-medium text-slate-400">
          {t(`${tier.key}_note`)}
        </p>
      </div>

      <div className="mb-6 text-center">
        {tier.isFree ? (
          <>
            <p className="text-4xl leading-none font-black text-emerald-600">
              {t('free')}
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {t('free_badge')}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl leading-none font-black text-slate-900">
                {tier.price}
              </span>
              <span className="mb-1 text-sm font-semibold text-slate-500">
                {t('currency')}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{t('total_price')}</p>
          </>
        )}
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-sm text-slate-600">{t('price_per_order')}</span>
          <span className="text-sm font-semibold text-slate-900">
            {tier.isFree ? t('free') : `${tier.perOrder} ${t('currency')}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Check className="h-4 w-4 text-emerald-600" />
          {t('check_1')}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Check className="h-4 w-4 text-emerald-600" />
          {t('check_2')}
        </div>
      </div>

      <Button
        onClick={onSelect}
        className={`mt-auto h-11 w-full rounded-xl font-bold ${
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
