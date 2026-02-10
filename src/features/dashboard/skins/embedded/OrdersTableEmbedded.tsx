import { IndexTable, Text, Badge } from '@shopify/polaris'
import type { OrderItem } from '@/types/dashboard.model'
import type { VerificationStatus } from '@/types/dashboard.model'

// ─── Polaris Badge tone mapping ──────────────────────────────────────────────

type PolarisBadgeTone =
  | 'success'
  | 'attention'
  | 'warning'
  | 'info'
  | 'critical'
  | undefined

const STATUS_TONE_MAP: Record<VerificationStatus, PolarisBadgeTone> = {
  confirmed: 'success',
  pending: 'attention',
  sent: 'info',
  delivered: 'info',
  read: 'info',
  canceled: 'critical',
  failed: 'critical',
  expired: 'warning',
}

// ─── Component ───────────────────────────────────────────────────────────────

interface OrdersTableEmbeddedProps {
  orders: OrderItem[]
}

/**
 * Embedded skin for the orders table.
 * Uses Shopify Polaris IndexTable — no Tailwind imports allowed.
 */
export function OrdersTableEmbedded({ orders }: OrdersTableEmbeddedProps) {
  const resourceName = {
    singular: 'order',
    plural: 'orders',
  }

  const headings = [
    { title: 'Order' },
    { title: 'Customer' },
    { title: 'Total' },
    { title: 'Verification' },
    { title: 'Created' },
  ] as const

  const rowMarkup = orders.map((order, index) => (
    <IndexTable.Row id={order.id} key={order.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {order.order_number || 'Order'}
        </Text>
        <br />
        <Text variant="bodySm" tone="subdued" as="span">
          {order.external_order_id}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {order.customer_name || 'Unknown customer'}
        </Text>
        <br />
        <Text variant="bodySm" tone="subdued" as="span">
          {order.customer_phone}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {order.total_price
            ? `${order.total_price} ${order.currency ?? ''}`
            : '-'}
        </Text>
        <br />
        <Text variant="bodySm" tone="subdued" as="span">
          {order.customer_email || 'No email'}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {order.verification_status ? (
          <Badge tone={STATUS_TONE_MAP[order.verification_status]}>
            {order.verification_status}
          </Badge>
        ) : (
          <Text variant="bodySm" tone="subdued" as="span">
            Not sent
          </Text>
        )}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodySm" tone="subdued" as="span">
          {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  ))

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={orders.length}
      headings={[...headings]}
      selectable={false}
    >
      {rowMarkup}
    </IndexTable>
  )
}
