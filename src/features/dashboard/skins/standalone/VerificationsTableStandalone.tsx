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
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-140 text-left text-sm">
        <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3 text-center font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 text-right font-semibold">Total</th>
            <th className="px-4 py-3 text-right font-semibold">Created</th>
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
                  {verification.customer_name || 'Unknown customer'}
                </div>
                <div className="text-xs text-slate-500">
                  {verification.customer_phone || 'No phone'}
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
