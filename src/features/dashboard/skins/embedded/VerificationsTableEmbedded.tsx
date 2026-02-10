import { IndexTable, Text, Badge } from '@shopify/polaris'
import type { VerificationItem } from '@/types/dashboard.model'
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

interface VerificationsTableEmbeddedProps {
  verifications: VerificationItem[]
}

/**
 * Embedded skin for the verifications table.
 * Uses Shopify Polaris IndexTable — no Tailwind imports allowed.
 */
export function VerificationsTableEmbedded({
  verifications,
}: VerificationsTableEmbeddedProps) {
  const resourceName = {
    singular: 'verification',
    plural: 'verifications',
  }

  const headings = [
    { title: 'Status' },
    { title: 'Customer' },
    { title: 'Order' },
    { title: 'Created' },
  ] as const

  const rowMarkup = verifications.map((verification, index) => (
    <IndexTable.Row id={verification.id} key={verification.id} position={index}>
      <IndexTable.Cell>
        <Badge tone={STATUS_TONE_MAP[verification.status]}>
          {verification.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {verification.customer_name || 'Unknown customer'}
        </Text>
        <br />
        <Text variant="bodySm" tone="subdued" as="span">
          {verification.customer_phone || 'No phone'}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {verification.order_number || 'Order'}
        </Text>
        <br />
        <Text variant="bodySm" tone="subdued" as="span">
          {verification.order_id}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodySm" tone="subdued" as="span">
          {verification.created_at
            ? new Date(verification.created_at).toLocaleString()
            : '-'}
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  ))

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={verifications.length}
      headings={[...headings]}
      selectable={false}
    >
      {rowMarkup}
    </IndexTable>
  )
}
