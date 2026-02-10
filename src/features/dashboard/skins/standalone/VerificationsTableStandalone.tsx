import { StatusBadge } from '@/components/ui'
import type { VerificationItem } from '@/types/dashboard.model'

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
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {verifications.map((verification) => (
            <tr key={verification.id} className="text-slate-700">
              <td className="px-4 py-3">
                <StatusBadge status={verification.status} />
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {verification.customer_name || 'Unknown customer'}
                </div>
                <div className="text-xs text-slate-500">
                  {verification.customer_phone || 'No phone'}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {verification.order_number || 'Order'}
                </div>
                <div className="text-xs text-slate-500">
                  {verification.order_id}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
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
