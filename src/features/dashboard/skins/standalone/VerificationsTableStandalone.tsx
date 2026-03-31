'use client'

import { useTranslations } from 'next-intl'
import { StatusBadge } from '../../ui/shared/StatusBadge'
import type { VerificationItem } from '../../model/dashboard.model'

interface VerificationsTableStandaloneProps {
  verifications: VerificationItem[]
}

/**
 * Standalone skin for the verifications table.
 * Uses Tailwind CSS — no Polaris imports allowed.
 */
export function VerificationsTableStandalone({
  verifications,
}: VerificationsTableStandaloneProps) {
  const t = useTranslations('dashboard.table')

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-140 text-left text-sm">
        <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3 text-center font-semibold">{t('headings.order')}</th>
            <th className="px-4 py-3 font-semibold">{t('headings.status')}</th>
            <th className="px-4 py-3 font-semibold">{t('headings.customer')}</th>
            <th className="px-4 py-3 text-right font-semibold">{t('headings.total')}</th>
            <th className="px-4 py-3 text-right font-semibold">{t('headings.created')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {verifications.map((verification) => (
            <tr key={verification.id} className="text-slate-700">
              <td className="px-4 py-4 text-center">
                <div className="font-semibold text-slate-900">
                  {verification.order_number || '-'}
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  {verification.order_id}
                </div>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={verification.status} />
              </td>
              <td className="px-4 py-4">
                <div className="font-medium text-slate-900">
                  {verification.customer_name || t('unknownCustomer')}
                </div>
                <div className="text-xs text-slate-500">
                  {verification.customer_phone || t('noPhone')}
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <div className="font-medium text-slate-900">
                  {verification.total_price
                    ? `${verification.total_price} ${verification.currency || 'SAR'}`
                    : '-'}
                </div>
              </td>
              <td className="px-4 py-4 text-right text-xs text-slate-500">
                {verification.created_at
                  ? new Date(verification.created_at).toLocaleString()
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
