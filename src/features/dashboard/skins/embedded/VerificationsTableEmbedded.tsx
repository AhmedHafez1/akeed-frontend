import {
  Badge,
  BlockStack,
  Button,
  ButtonGroup,
  IndexTable,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type {
  VerificationItem,
  VerificationStatus,
} from '../../model/dashboard.model'

type PolarisBadgeTone =
  | 'attention'
  | 'critical'
  | 'info'
  | 'success'
  | 'warning'
  | undefined

const STATUS_TONE_MAP: Record<VerificationStatus, PolarisBadgeTone> = {
  pending: undefined,
  confirmed: 'success',
  sent: 'info',
  delivered: 'info',
  read: 'info',
  canceled: 'critical',
  failed: 'critical',
  expired: 'warning',
  no_reply: 'attention',
}

interface VerificationsTableEmbeddedProps {
  verifications: VerificationItem[]
  cancelingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  cancelOrderErrors: Record<string, string>
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>
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

function formatCurrencyTotal(
  verification: VerificationItem,
  locale: string
): string {
  if (!verification.total_price) {
    return '-'
  }

  const currency = verification.currency ?? 'SAR'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(verification.total_price))
  } catch {
    return `${verification.total_price} ${currency}`
  }
}

function formatCreatedDate(value: string | null, locale: string): string {
  if (!value) return '-'

  const date = new Date(value)
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

function formatCreatedTime(value: string | null, locale: string): string {
  if (!value) return ''

  const date = new Date(value)
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTooltipDateTime(value: string | null, locale: string): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getStatusTimestamp(verification: VerificationItem): string | null {
  switch (verification.status) {
    case 'sent':
      return verification.last_sent_at
    case 'delivered':
      return verification.delivered_at
    case 'read':
      return verification.read_at
    case 'confirmed':
      return verification.confirmed_at
    case 'canceled':
      return verification.canceled_at
    case 'expired':
      return verification.expired_at
    case 'no_reply':
      return verification.no_reply_at
    default:
      return null
  }
}

export function VerificationsTableEmbedded({
  verifications,
  cancelingVerificationId,
  confirmingCancelVerificationId,
  cancelOrderErrors,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
}: VerificationsTableEmbeddedProps) {
  const t = useTranslations('dashboard')
  const { isRTL, locale } = useLocaleInfo()
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
    { title: t('table.headings.followUp'), alignment: textAlignment },
    { title: t('table.headings.total'), alignment: textAlignment },
    { title: t('table.headings.created'), alignment: textAlignment },
    { title: t('table.headings.actions'), alignment: textAlignment },
  ] as const

  const rows = verifications.map((verification, index) => {
    const isConfirming = confirmingCancelVerificationId === verification.id
    const isCanceling = cancelingVerificationId === verification.id
    const cancelError = cancelOrderErrors[verification.id]
    const statusTitle = formatTooltipDateTime(
      getStatusTimestamp(verification),
      locale
    )
    const followUpTitle = formatTooltipDateTime(
      verification.follow_up_sent_at,
      locale
    )
    const followUpLabel = verification.follow_up_sent_at
      ? t('table.followUp.sent')
      : t('table.followUp.notSent')

    return (
      <IndexTable.Row
        id={verification.id}
        key={verification.id}
        position={index}
      >
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
            <span title={statusTitle || undefined}>
              <Badge tone={STATUS_TONE_MAP[verification.status]}>
                {t(`verificationStatus.${verification.status}`)}
              </Badge>
            </span>
          </div>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <div className={dataCellClassName}>
            <Text
              variant="bodySm"
              tone={verification.follow_up_sent_at ? undefined : 'subdued'}
              as="span"
            >
              <span title={followUpTitle || undefined}>{followUpLabel}</span>
            </Text>
          </div>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <div className={dataCellClassName}>
            <Text variant="bodyMd" fontWeight="semibold" as="p">
              {formatCurrencyTotal(verification, locale)}
            </Text>
          </div>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <div className={dataCellClassName}>
            <BlockStack gap="100">
              <Text variant="bodySm" as="p">
                {formatCreatedDate(verification.created_at, locale)}
              </Text>
              <Text variant="bodyXs" tone="subdued" as="p">
                {formatCreatedTime(verification.created_at, locale)}
              </Text>
            </BlockStack>
          </div>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <div className={dataCellClassName}>
            {verification.status === 'no_reply' ? (
              <BlockStack gap="150">
                {isConfirming ? (
                  <BlockStack gap="150">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t('table.actions.cancelOrderConfirmDescription')}
                    </Text>
                    <ButtonGroup>
                      <Button
                        size="slim"
                        tone="critical"
                        loading={isCanceling}
                        disabled={isCanceling}
                        onClick={() =>
                          void onConfirmCancelOrder(verification.id)
                        }
                      >
                        {isCanceling
                          ? t('table.actions.cancelingOrder')
                          : t('table.actions.confirmCancelOrder')}
                      </Button>
                      <Button
                        size="slim"
                        disabled={isCanceling}
                        onClick={() => onDismissCancelOrder(verification.id)}
                      >
                        {t('table.actions.keepOrder')}
                      </Button>
                    </ButtonGroup>
                  </BlockStack>
                ) : (
                  <Button
                    size="slim"
                    tone="critical"
                    onClick={() => onRequestCancelOrder(verification.id)}
                  >
                    {t('table.actions.cancelOrder')}
                  </Button>
                )}

                {cancelError && (
                  <Text as="p" variant="bodyXs" tone="critical">
                    {cancelError}
                  </Text>
                )}
              </BlockStack>
            ) : (
              <Text as="span" variant="bodySm" tone="subdued">
                -
              </Text>
            )}
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  })

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
