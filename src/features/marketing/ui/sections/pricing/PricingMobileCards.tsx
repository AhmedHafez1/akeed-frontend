import { Zap } from 'lucide-react'
import { Tier } from '@/features/marketing/model/tier.model'

interface PricingMobileCardsProps {
  tiers: Tier[]
  t: (key: string) => string
}

export function PricingMobileCards({ tiers, t }: PricingMobileCardsProps) {
  return (
    <div className="space-y-4 lg:hidden">
      {tiers.map((tier) => (
        <div
          key={tier.key}
          className={`rounded-xl border p-5 transition-all ${
            tier.key === 'pro'
              ? 'relative border-2 border-emerald-500 bg-white shadow-lg'
              : 'border-gray-200 bg-white shadow-sm'
          }`}
        >
          {tier.key === 'pro' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1 rounded-full bg-linear-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                <Zap className="h-3 w-3" />
                {t('most_popular')}
              </span>
            </div>
          )}

          <div className="mt-2 mb-4 text-center">
            <h3 className="mb-1 text-lg font-bold">{t(`tiers.${tier.key}`)}</h3>
            {!tier.isFree && tier.ordersDisplay && (
              <span className="text-sm text-gray-500">
                {tier.ordersDisplay} {t('orders_label')}
              </span>
            )}
          </div>

          <div className="mb-4 border-y border-gray-200 py-4 text-center">
            {tier.isFree ? (
              <div>
                <span className="mb-2 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-base font-bold text-white">
                  {t('free')}
                </span>
                <p className="mt-2 text-sm font-semibold text-gray-700">
                  {t('free_badge')}
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-2 text-3xl font-bold text-emerald-600">
                  {tier.price} <span className="text-lg">{t('currency')}</span>
                </div>
                <div className="text-sm text-gray-600">{t('total_price')}</div>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="mb-1 text-xs text-gray-500">
              {t('price_per_order')}
            </div>
            {tier.isFree ? (
              <div className="text-xl font-bold text-emerald-500">
                {t('free')}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-semibold">
                  {tier.perOrder} {t('currency')}
                </span>
                {tier.saving && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    {t('saving')} {tier.saving}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
