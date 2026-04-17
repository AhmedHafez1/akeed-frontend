import { Badge, BlockStack, IndexTable, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type {
  VerificationItem,
  VerificationStatus,
} from '../../model/dashboard.model'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'

type PolarisBadgeTone =
  | 'attention'
  | 'critical'
  | 'info'
  | 'success'
  | 'warning'
  | undefined

const STATUS_TONE_MAP: Record<VerificationStatus, PolarisBadgeTone> = {
  confirmed: 'success',
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
    return '—'
  }

  const currency = verification.currency ?? 'SAR'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(verification.total_price))
  } catch {
    return `${verification.total_price} ${currency}`
  }
}

function formatCreatedDate(value: string | null): string {
  if (!value) return '—'

  const date = new Date(value)
  return date.toLocaleDateString(undefined, {
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
  const { isRTL } = useLocaleInfo()
  const textAlignment = isRTL ? 'end' : undefined
  const dataCellClassName = isRTL ? 'w-full text-right' : 'w-full'
  const statusCellClassName = 'flex w-full'

  const resourceName = {
    singular: t('table.resource.singular'),
    plural: t('table.resource.plural'),
  }

  const headings = [
    { title: t('table.headings.order'), alignment: textAlignment },
    { title: t('table.headings.customer'), alignment: textAlignment },
    { title: t('table.headings.status'), alignment: textAlignment },
    { title: t('table.headings.total'), alignment: textAlignment },
    { title: t('table.headings.created'), alignment: textAlignment },
  ] as const

  const rows = verifications.map((verification, index) => (
    <IndexTable.Row id={verification.id} key={verification.id} position={index}>
      <IndexTable.Cell>
        <div className={dataCellClassName}>
          <BlockStack gap="100">
            <Text variant="bodyMd" fontWeight="semibold" as="p">
              {formatOrderTitle(verification, t('table.orderFallbackPrefix'))}
            </Text>
            <Text variant="bodySm" tone="subdued" as="p">
              {verification.order_id.slice(0, 12)}
            </Text>
          </BlockStack>
        </div>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <div className={dataCellClassName}>
          <BlockStack gap="100">
            <Text variant="bodyMd" fontWeight="semibold" as="p">
              {verification.customer_name || t('table.unknownCustomer')}
            </Text>
            <Text variant="bodySm" tone="subdued" as="p">
              {verification.customer_phone || t('table.noPhone')}
            </Text>
          </BlockStack>
        </div>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <div className={statusCellClassName}>
          <Badge tone={STATUS_TONE_MAP[verification.status]}>
            {t(`verificationStatus.${verification.status}`)}
          </Badge>
        </div>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <div className={dataCellClassName}>
          <Text variant="bodyMd" fontWeight="semibold" as="p">
            {formatCurrencyTotal(verification)}
          </Text>
        </div>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <div className={dataCellClassName}>
          <BlockStack gap="100">
            <Text variant="bodySm" as="p">
              {formatCreatedDate(verification.created_at)}
            </Text>
            <Text variant="bodyXs" tone="subdued" as="p">
              {formatCreatedTime(verification.created_at)}
            </Text>
          </BlockStack>
        </div>
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
