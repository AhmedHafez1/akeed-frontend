import {
  Badge,
  BlockStack,
  Button,
  ButtonGroup,
  IndexTable,
  Text,
} from '@shopify/polaris'
import {
  canCancelOrder,
  cancellationMessageKey,
} from '@/features/dashboard/domain/cancellation'
import {
  canRetryVerification,
  lifecycleTone,
  type LifecycleTone,
} from '@/features/dashboard/domain/verificationLifecycle'
import {
  formatCreatedDate,
  formatCreatedTime,
  formatCurrencyTotal,
  formatOrderTitle,
  formatTooltipDateTime,
  getStatusTimestamp,
  resolveRowDescriptionKey,
} from '@/features/dashboard/domain/verificationRow'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type { VerificationItem } from '../../model/dashboard.model'

type PolarisBadgeTone =
  | 'attention'
  | 'critical'
  | 'info'
  | 'success'
  | 'warning'
  | undefined

/** Semantic lifecycle tones rendered in the Polaris design system. */
const TONE_BADGES: Record<LifecycleTone, PolarisBadgeTone> = {
  neutral: undefined,
  info: 'info',
  progress: 'info',
  success: 'success',
  warning: 'warning',
  attention: 'attention',
  critical: 'critical',
}

interface VerificationsTableEmbeddedProps {
  verifications: VerificationItem[]
  reportingTimezone: string
  actingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  actionErrors: Record<string, string>
  canCancelOrders: boolean
  canRetryVerifications: boolean
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>
  onRetryVerification: (verificationId: string) => Promise<void>
}

export function VerificationsTableEmbedded({
  verifications,
  reportingTimezone,
  actingVerificationId,
  confirmingCancelVerificationId,
  actionErrors,
  canCancelOrders,
  canRetryVerifications,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  onRetryVerification,
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
    const isActing = actingVerificationId === verification.id
    const actionError = actionErrors[verification.id]
    const statusTitle = formatTooltipDateTime(
      getStatusTimestamp(verification),
      locale,
      reportingTimezone
    )
    const followUpTitle = formatTooltipDateTime(
      verification.follow_up_sent_at,
      locale,
      reportingTimezone
    )
    const showRetry =
      canRetryVerifications && canRetryVerification(verification.capabilities)
    const showCancel = canCancelOrders && canCancelOrder(verification)
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
              <div className="flex items-center gap-2">
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  {formatOrderTitle(
                    verification,
                    t('table.orderFallbackPrefix')
                  )}
                </Text>
                {verification.is_test && (
                  <Badge tone="info">{t('table.testBadge')}</Badge>
                )}
              </div>
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
          <div className={dataCellClassName}>
            <BlockStack gap="100">
              <div className={statusCellClassName}>
                <span title={statusTitle || undefined}>
                  <Badge tone={TONE_BADGES[lifecycleTone(verification.status)]}>
                    {t(`verificationStatus.${verification.status}`)}
                  </Badge>
                </span>
              </div>
              <Text variant="bodySm" tone="subdued" as="p">
                {t(resolveRowDescriptionKey(verification))}
              </Text>
            </BlockStack>
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
                {formatCreatedDate(
                  verification.created_at,
                  locale,
                  reportingTimezone
                )}
              </Text>
              <Text variant="bodyXs" tone="subdued" as="p">
                {formatCreatedTime(
                  verification.created_at,
                  locale,
                  reportingTimezone
                )}
              </Text>
            </BlockStack>
          </div>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <div className={dataCellClassName}>
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
                      loading={isActing}
                      disabled={isActing}
                      onClick={() => void onConfirmCancelOrder(verification.id)}
                    >
                      {isActing
                        ? t('table.actions.cancelingOrder')
                        : t('table.actions.confirmCancelOrder')}
                    </Button>
                    <Button
                      size="slim"
                      disabled={isActing}
                      onClick={() => onDismissCancelOrder(verification.id)}
                    >
                      {t('table.actions.keepOrder')}
                    </Button>
                  </ButtonGroup>
                </BlockStack>
              ) : showRetry || showCancel ? (
                <ButtonGroup>
                  {showRetry && (
                    <Button
                      size="slim"
                      loading={isActing}
                      disabled={isActing}
                      onClick={() => void onRetryVerification(verification.id)}
                    >
                      {isActing
                        ? t('table.actions.retrying')
                        : t('table.actions.retry')}
                    </Button>
                  )}
                  {showCancel && (
                    <Button
                      size="slim"
                      tone="critical"
                      disabled={isActing}
                      onClick={() => onRequestCancelOrder(verification.id)}
                    >
                      {t('table.actions.cancelOrder')}
                    </Button>
                  )}
                </ButtonGroup>
              ) : (
                <Text as="span" variant="bodySm" tone="subdued">
                  {cancellationMessageKey(verification)
                    ? t(`table.actions.${cancellationMessageKey(verification)}`)
                    : '—'}
                </Text>
              )}

              {actionError && (
                <div role="alert">
                  <Text as="p" variant="bodyXs" tone="critical">
                    {actionError}
                  </Text>
                </div>
              )}
            </BlockStack>
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
