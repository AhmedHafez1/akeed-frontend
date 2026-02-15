import { Badge, BlockStack, IndexTable, Text } from '@shopify/polaris'
import type { VerificationItem, VerificationStatus } from '@/types/dashboard.model'

type PolarisBadgeTone =
  | 'attention'
  | 'critical'
  | 'info'
  | 'success'
  | 'warning'
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

const STATUS_LABEL_MAP: Record<VerificationStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  canceled: 'Cancelled',
  failed: 'Failed',
  expired: 'Expired',
}

interface VerificationsTableEmbeddedProps {
  verifications: VerificationItem[]
}

function formatOrderTitle(verification: VerificationItem): string {
  if (verification.order_number) {
    return `#${verification.order_number}`
  }

  return `Order ${verification.order_id.slice(0, 8)}`
}

function formatCurrencyTotal(verification: VerificationItem): string {
  if (!verification.total_price) {
    return '-'
  }

  return `${verification.total_price} ${verification.currency ?? 'SAR'}`
}

function formatCreatedDate(value: string | null): string {
  if (!value) return '-'

  const date = new Date(value)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatCreatedTime(value: string | null): string {
  if (!value) return ''

  const date = new Date(value)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VerificationsTableEmbedded({
  verifications,
}: VerificationsTableEmbeddedProps) {
  const resourceName = {
    singular: 'verification',
    plural: 'verifications',
  }

  const headings = [
    { title: 'Order' },
    { title: 'Customer' },
    { title: 'Status' },
    { title: 'Total', alignment: 'end' as const },
    { title: 'Created', alignment: 'end' as const },
  ] as const

  const rows = verifications.map((verification, index) => (
    <IndexTable.Row id={verification.id} key={verification.id} position={index}>
      <IndexTable.Cell>
        <BlockStack gap="100">
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {formatOrderTitle(verification)}
          </Text>
          <Text variant="bodySm" tone="subdued" as="span">
            {verification.order_id.slice(0, 12)}
          </Text>
        </BlockStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <BlockStack gap="100">
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {verification.customer_name || 'Unknown customer'}
          </Text>
          <Text variant="bodySm" tone="subdued" as="span">
            {verification.customer_phone || 'No phone'}
          </Text>
        </BlockStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Badge tone={STATUS_TONE_MAP[verification.status]}>
          {STATUS_LABEL_MAP[verification.status]}
        </Badge>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text alignment="end" variant="bodyMd" fontWeight="semibold" as="p">
          {formatCurrencyTotal(verification)}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <BlockStack gap="100">
          <Text alignment="end" variant="bodySm" as="p">
            {formatCreatedDate(verification.created_at)}
          </Text>
          <Text alignment="end" variant="bodyXs" tone="subdued" as="p">
            {formatCreatedTime(verification.created_at)}
          </Text>
        </BlockStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ))

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={verifications.length}
      headings={[...headings]}
      selectable={false}
      hasZebraStriping
    >
      {rows}
    </IndexTable>
  )
}
