import { Badge, BlockStack, IndexTable, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type {
  VerificationItem,
  VerificationStatus,
} from '@/types/dashboard.model'

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

interface VerificationsTableEmbeddedProps {
  verifications: VerificationItem[]
}

function formatOrderTitle(
  verification: VerificationItem,
  fallbackLabel: string
): string {
  if (verification.order_number) {
    return `#${verification.order_number}`
  }

  return `${fallbackLabel} ${verification.order_id.slice(0, 8)}`
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
  const t = useTranslations('dashboard')

  const resourceName = {
    singular: t('table.resource.singular'),
    plural: t('table.resource.plural'),
  }

  const headings = [
    { title: t('table.headings.order') },
    { title: t('table.headings.customer') },
    { title: t('table.headings.status') },
    { title: t('table.headings.total'), alignment: 'end' as const },
    { title: t('table.headings.created'), alignment: 'end' as const },
  ] as const

  const rows = verifications.map((verification, index) => (
    <IndexTable.Row id={verification.id} key={verification.id} position={index}>
      <IndexTable.Cell>
        <BlockStack gap="100">
          <Text variant="bodyMd" fontWeight="semibold" as="p">
            {formatOrderTitle(verification, t('table.orderFallbackPrefix'))}
          </Text>
          <Text variant="bodySm" tone="subdued" as="p">
            {verification.order_id.slice(0, 12)}
          </Text>
        </BlockStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <BlockStack gap="100">
          <Text variant="bodyMd" fontWeight="semibold" as="p">
            {verification.customer_name || t('table.unknownCustomer')}
          </Text>
          <Text variant="bodySm" tone="subdued" as="p">
            {verification.customer_phone || t('table.noPhone')}
          </Text>
        </BlockStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Badge tone={STATUS_TONE_MAP[verification.status]}>
          {t(`verificationStatus.${verification.status}`)}
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
