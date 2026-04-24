import { motion } from 'framer-motion'
import {
  ArrowDownRight,
  Package2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { RoiRow } from '@/features/marketing/model/roi.model'

interface ROICalculatorTableProps {
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

export function ROICalculatorTable({ rows, t }: ROICalculatorTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm lg:block lg:p-5"
    >
      <div className="mb-4 grid grid-cols-[1.15fr_1fr_1fr_1.1fr] gap-3 rounded-2xl bg-slate-50 p-4 text-left">
        <div>
          <span className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">
            {t('orders')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <TrendingUp className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {t('returns_without')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <TrendingDown className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {t('returns_with')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <ArrowDownRight className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {t('savings')}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => {
          const without = parseMetric(row.returnsWithout)
          const withAkeed = parseMetric(row.returnsWith)

          return (
            <motion.div
              key={row.orders}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="grid grid-cols-[1.15fr_1fr_1fr_1.1fr] gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
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

              <div className="rounded-2xl bg-rose-50 px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.12em] text-rose-500 uppercase">
                  {t('returns_without')}
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-2xl font-black tracking-tight text-rose-700">
                    {without.count}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-rose-500">
                    {without.ratio}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.12em] text-emerald-600 uppercase">
                  {t('returns_with')}
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-2xl font-black tracking-tight text-emerald-700">
                    {withAkeed.count}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-emerald-600">
                    {withAkeed.ratio}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-linear-to-r from-orange-50 to-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.12em] text-orange-500 uppercase">
                  {t('savings')}
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {row.savings}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-slate-500">
                    {t('currency')}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-emerald-600">
                  {row.reduction} {t('reduction_label')}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
