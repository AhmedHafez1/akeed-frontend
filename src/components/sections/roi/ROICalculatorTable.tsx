import { motion } from 'framer-motion'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { RoiRow } from '@/types/roi.model'

interface ROICalculatorTableProps {
  rows: RoiRow[]
  t: (key: string) => string
}

export function ROICalculatorTable({ rows, t }: ROICalculatorTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="hidden overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white shadow-2xl sm:block"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead>
            <tr className="bg-linear-to-r from-emerald-50 via-emerald-100 to-emerald-50">
              <th className="px-4 py-5 text-sm font-black tracking-wide text-slate-700 uppercase lg:px-6 lg:text-base">
                {t('orders')}
              </th>
              <th className="px-4 py-5 text-sm font-black tracking-wide text-slate-700 uppercase lg:px-6 lg:text-base">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 shadow-md">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span>{t('returns_without')}</span>
                </div>
              </th>
              <th className="px-4 py-5 text-sm font-black tracking-wide text-slate-700 uppercase lg:px-6 lg:text-base">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-md">
                    <TrendingDown className="h-5 w-5 text-white" />
                  </div>
                  <span>{t('returns_with')}</span>
                </div>
              </th>
              <th className="bg-linear-to-r from-emerald-500 to-emerald-600 px-4 py-5 text-sm font-black tracking-wide text-white uppercase shadow-inner lg:px-6 lg:text-base">
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className="h-6 w-6" />
                  <span>{t('savings')}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <motion.tr
                key={row.orders}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`border-t-2 border-emerald-100 transition-all hover:bg-emerald-50/70 ${
                  idx === 1 ? 'bg-emerald-50/40' : ''
                }`}
              >
                <td className="px-4 py-6 text-2xl font-black text-slate-800 lg:px-6 lg:text-3xl">
                  {row.orders}
                </td>
                <td className="px-4 py-6 lg:px-6">
                  <div className="inline-flex flex-col items-center rounded-xl bg-linear-to-br from-red-50 to-red-100 px-5 py-3 shadow-sm">
                    <span className="text-xl font-black text-red-700 lg:text-2xl">
                      {row.returnsWithout.split(' ')[0]}
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {row.returnsWithout.split(' ')[1]}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-6 lg:px-6">
                  <div className="inline-flex flex-col items-center rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100 px-5 py-3 shadow-sm">
                    <span className="text-xl font-black text-emerald-700 lg:text-2xl">
                      {row.returnsWith.split(' ')[0]}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {row.returnsWith.split(' ')[1]}
                    </span>
                  </div>
                </td>
                <td className="bg-linear-to-r from-emerald-50 via-emerald-100 to-emerald-50 px-4 py-6 lg:px-6">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-emerald-700 lg:text-4xl">
                      {row.savings}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {t('currency')}
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
