import { Zap } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Tier } from '@/features/marketing/model/tier.model'

interface PricingDesktopTableProps {
  tiers: Tier[]
  t: (key: string) => string
  onCtaClick: () => void
}

export function PricingDesktopTable({
  tiers,
  t,
  onCtaClick,
}: PricingDesktopTableProps) {
  return (
    <div className="hidden lg:block">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex justify-center">
          <div className="grid w-full grid-cols-5 gap-3">
            <div className="col-span-1" />
            {tiers.map((tier) => (
              <div key={tier.key} className="flex justify-center">
                {tier.key === 'pro' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                    <Zap className="h-3 w-3" />
                    {t('most_popular')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-x-3">
          <div className="flex flex-col">
            <div className="flex h-24 items-center rounded-t-lg bg-slate-100 px-4 text-sm font-bold">
              {t('tier')}
            </div>
            <div className="flex h-32 items-center border-y border-slate-200 bg-slate-100 px-4 text-sm font-bold">
              {t('total_price')}
            </div>
            <div className="flex h-24 items-center rounded-b-lg bg-slate-100 px-4 text-sm font-bold">
              {t('price_per_order')}
            </div>
          </div>

          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={`flex flex-col ${tier.key === 'pro' ? 'relative z-10' : ''}`}
            >
              <div
                className={`flex h-24 flex-col items-center justify-center rounded-t-lg border-t p-3 text-center ${
                  tier.key === 'pro'
                    ? 'border-x-2 border-t-2 border-emerald-500 bg-white shadow-md'
                    : 'border-x border-gray-200 bg-white'
                }`}
              >
                <div className="text-sm font-bold">
                  {t(`tiers.${tier.key}`)}
                </div>
                {!tier.isFree && tier.ordersDisplay && (
                  <div className="mt-1 text-xs text-gray-400">
                    {tier.ordersDisplay} {t('orders_label')}
                  </div>
                )}
              </div>

              <div
                className={`flex h-32 items-center justify-center border-y p-4 ${
                  tier.key === 'pro'
                    ? 'border-x-2 border-y-2 border-emerald-500 bg-white shadow-md'
                    : 'border-x border-gray-200 bg-white'
                }`}
              >
                {tier.isFree ? (
                  <div className="text-center">
                    <span className="mb-2 inline-block rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white">
                      {t('free')}
                    </span>
                    <div className="mt-2 text-xs font-semibold">
                      {t('free_badge')}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {tier.price}
                    </div>
                    <div className="text-xs text-gray-500">{t('currency')}</div>
                  </div>
                )}
              </div>

              <div
                className={`flex h-24 flex-col items-center justify-center rounded-b-lg border-b p-3 ${
                  tier.key === 'pro'
                    ? 'border-x-2 border-b-2 border-emerald-500 bg-white shadow-md'
                    : 'border-x border-gray-200 bg-white'
                }`}
              >
                {tier.isFree ? (
                  <span className="text-base font-bold text-emerald-500">
                    {t('free')}
                  </span>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-semibold">
                      {tier.perOrder} {t('currency')}
                    </span>
                    {tier.saving && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {t('saving')} {tier.saving}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Button
          size="lg"
          className="h-14 w-full rounded-xl bg-orange-500 font-bold text-white transition-all hover:scale-105 hover:bg-orange-600 sm:w-auto"
          onClick={onCtaClick}
        >
          {t('cta_recharge')}
        </Button>
      </div>
    </div>
  )
}
