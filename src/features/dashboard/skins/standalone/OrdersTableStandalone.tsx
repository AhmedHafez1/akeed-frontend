import { StatusBadge } from '@/components/ui'
import type { OrderItem } from '@/types/dashboard.model'

interface OrdersTableStandaloneProps {
  orders: OrderItem[]
}

/**
 * Standalone skin for the orders table.
 * Uses Tailwind CSS — no Polaris imports allowed.
 */
export function OrdersTableStandalone({ orders }: OrdersTableStandaloneProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 text-left text-sm">
        <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Total</th>
            <th className="px-4 py-3 font-semibold">Verification</th>
            <th className="px-4 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="text-slate-700">
              <td className="px-4 py-3">
                <div className="font-medium">
                  {order.order_number || 'Order'}
                </div>
                <div className="text-xs text-slate-500">
                  {order.external_order_id}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {order.customer_name || 'Unknown customer'}
                </div>
                <div className="text-xs text-slate-500">
                  {order.customer_phone}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {order.total_price
                    ? `${order.total_price} ${order.currency ?? ''}`
                    : '-'}
                </div>
                <div className="text-xs text-slate-500">
                  {order.customer_email || 'No email'}
                </div>
              </td>
              <td className="px-4 py-3">
                {order.verification_status ? (
                  <StatusBadge status={order.verification_status} />
                ) : (
                  <span className="text-xs text-slate-500">Not sent</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {order.created_at
                  ? new Date(order.created_at).toLocaleString()
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
