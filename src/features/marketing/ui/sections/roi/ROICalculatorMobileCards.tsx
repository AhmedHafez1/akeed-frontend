import { motion } from 'framer-motion'
import {
  ArrowDownRight,
  Package2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { RoiRow } from '@/features/marketing/model/roi.model'

interface ROICalculatorMobileCardsProps {
  rows: RoiRow[]
  t: (key: string) => string
}

function parseMetric(value: string) {
  const [count, ratio] = value.split(' ')

  return {
    count,
    ratio: ratio?.replace(/[()]/g, '') ?? '',
  }
}

export function ROICalculatorMobileCards({
  rows,
  t,
}: ROICalculatorMobileCardsProps) {
  return (
    <div className="space-y-4 pb-8 lg:hidden">
      {rows.map((row, idx) => {
        const without = parseMetric(row.returnsWithout)
        const withAkeed = parseMetric(row.returnsWith)

        return (
          <motion.div
            key={row.orders}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                  <Package2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
                    {t('orders')}
                  </p>
                  <p className="text-2xl font-black tracking-tight text-slate-900">
                    {row.orders}
                  </p>
                </div>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                {row.reduction} {t('reduction_label')}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-rose-50 p-4">
                <div className="flex items-center gap-2 text-rose-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {t('returns_without')}
                  </span>
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-2xl font-black tracking-tight text-rose-700">
                    {without.count}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-rose-500">
                    {without.ratio}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {t('returns_with')}
                  </span>
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-2xl font-black tracking-tight text-emerald-700">
                    {withAkeed.count}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-emerald-600">
                    {withAkeed.ratio}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-linear-to-r from-orange-50 to-emerald-50 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase">
                  {t('savings')}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-center gap-2">
                <span className="text-4xl font-black tracking-tight text-slate-900">
                  {row.savings}
                </span>
                <span className="pb-1 text-base font-semibold text-slate-500">
                  {t('currency')}
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
