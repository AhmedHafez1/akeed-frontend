import {
  formatCount,
  formatOrderAmount,
} from '@/features/dashboard/lib/orderDisplay'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'

/** The two skins share data formatting, while keeping their native sections. */
export function getOrderDetails(row: VerificationItem, locale: string) {
  return {
    products: (row.line_items ?? []).map((item) => {
      const unitPrice = item.unit_price?.trim()
      const linePrice = unitPrice ? Number(unitPrice) * item.quantity : null
      return {
        name: item.name,
        options: (item.options ?? [])
          .map((option) => option.value)
          .filter(Boolean)
          .join(' / '),
        quantity: `× ${formatCount(item.quantity, locale)}`,
        amount:
          linePrice !== null && Number.isFinite(linePrice)
            ? formatOrderAmount(linePrice, row.currency, locale)
            : null,
      }
    }),
    region: row.shipping_region?.trim() ? row.shipping_region : null,
    address: row.shipping_address?.trim() ? row.shipping_address : null,
  }
}
