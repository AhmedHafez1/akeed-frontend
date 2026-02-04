import { motion } from 'framer-motion'
import { ArrowDown, TrendingDown, TrendingUp } from 'lucide-react'
import { RoiRow } from '@/types/roi.model'

interface ROICalculatorMobileCardsProps {
  rows: RoiRow[]
  t: (key: string) => string
}

export function ROICalculatorMobileCards({
  rows,
  t,
}: ROICalculatorMobileCardsProps) {
  return (
    <div className="space-y-6 pb-8 sm:hidden">
      {rows.map((row, idx) => (
        <motion.div
          key={row.orders}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1 }}
          className="group relative overflow-hidden rounded-2xl border-2 border-emerald-100 bg-white shadow-lg transition-all hover:shadow-xl"
        >
          <div className="absolute top-0 right-0 h-32 w-32 bg-linear-to-br from-emerald-100/50 to-transparent blur-2xl" />

          <div className="relative px-5 py-6">
            <div className="mb-5 flex items-center justify-between border-b-2 border-emerald-100 pb-4">
              <div>
                <span className="block text-lg font-semibold tracking-wide text-emerald-600 uppercase">
                  {t('orders')}
                </span>
              </div>
              <span className="block text-3xl font-black text-slate-800">
                {row.orders}
              </span>
            </div>

            <div className="mb-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-linear-to-r from-red-50 to-red-100/50 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 shadow-md">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold tracking-wide text-red-600 uppercase">
                      {t('returns_without')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-red-700">
                    {row.returnsWithout.split(' ')[0]}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-linear-to-r from-emerald-50 to-emerald-100/50 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-md">
                    <TrendingDown className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="flex gap-2 text-[10px] font-semibold tracking-wide text-emerald-600 uppercase">
                      <span>{t('returns_with')}</span>
                      <span className="flex items-center justify-center">
                        (
                        <span className="text-xs font-bold text-emerald-700">
                          {row.reduction}
                        </span>
                        <ArrowDown className="h-4 w-4 text-emerald-700" />)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-700">
                    {row.returnsWith.split(' ')[0]}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden p-5">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
              <div className="relative text-center">
                <div className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  <span>{t('savings')}</span>
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-black text-emerald-700">
                    {row.savings}
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    {t('currency')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
