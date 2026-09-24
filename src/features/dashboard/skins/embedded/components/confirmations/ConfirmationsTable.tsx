import { Badge, BlockStack, IndexTable, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  isNeedsActionRow,
  resolveRowStatus,
  type RowStatusTone,
} from '../../../../domain/confirmationRowStatus'
import {
  customerDisplayName,
  formatClockTime,
  formatOrderAmount,
  formatOrderNumber,
  formatPhoneInternational,
  formatUpdatedAt,
} from '../../../../lib/orderDisplay'
import type { VerificationItem } from '../../../../model/dashboard.model'
import { OrderNumberLink } from '../shared/OrderNumberLink'
import {
  ConfirmationRowActions,
  type ConfirmationRowActionHandlers,
} from './ConfirmationRowActions'

const BADGE_TONES: Record<
  RowStatusTone,
  'success' | 'critical' | 'attention' | undefined
> = {
  success: 'success',
  critical: 'critical',
  warning: 'attention',
  neutral: undefined,
}

function StatusCell({
  row,
  timeZone,
}: {
  row: VerificationItem
  timeZone: string
}) {
  const t = useTranslations('dashboard.confirmations.status')
  const { locale } = useLocaleInfo()
  const view = resolveRowStatus(row)
  const sub = view.sub
    ? t(view.sub, {
        time: view.subTime
          ? formatClockTime(view.subTime, locale, timeZone)
          : '',
      })
    : null

  return (
    <BlockStack gap="100" inlineAlign="start">
      <Badge tone={BADGE_TONES[view.tone]}>{t(view.badge)}</Badge>
      {sub && (
        <Text
          as="span"
          variant="bodySm"
          tone={
            view.tone === 'critical' && row.status === 'failed'
              ? 'critical'
              : 'subdued'
          }
        >
          {sub}
        </Text>
      )}
    </BlockStack>
  )
}

/**
 * The confirmations table: six columns, the status and its sub-line in one,
 * needs-action rows tinted amber, and paging in the footer.
 */
export function ConfirmationsTable({
  rows,
  timeZone,
  canWrite,
  canRetry,
  actingId,
  handlers,
  pagination,
}: {
  rows: VerificationItem[]
  timeZone: string
  canWrite: boolean
  canRetry: boolean
  actingId: string | null
  handlers: ConfirmationRowActionHandlers
  pagination: {
    label: string
    hasNext: boolean
    hasPrevious: boolean
    onNext: () => void
    onPrevious: () => void
    previousLabel: string
    nextLabel: string
  }
}) {
  const t = useTranslations('dashboard')
  const { isRTL, locale } = useLocaleInfo()
  const alignment = isRTL ? ('end' as const) : undefined
  const cellClassName = isRTL ? 'w-full text-right' : 'w-full'

  const headings = [
    { title: t('confirmations.headings.order'), alignment },
    { title: t('confirmations.headings.customer'), alignment },
    { title: t('confirmations.headings.status'), alignment },
    { title: t('confirmations.headings.total'), alignment },
    { title: t('confirmations.headings.updated'), alignment },
    { title: t('confirmations.headings.action'), alignment },
  ] as const

  return (
    <IndexTable
      resourceName={{
        singular: t('confirmations.resource.singular'),
        plural: t('confirmations.resource.plural'),
      }}
      itemCount={rows.length}
      headings={[...headings]}
      selectable={false}
      pagination={{
        label: pagination.label,
        hasNext: pagination.hasNext,
        hasPrevious: pagination.hasPrevious,
        onNext: pagination.onNext,
        onPrevious: pagination.onPrevious,
        accessibilityLabels: {
          previous: pagination.previousLabel,
          next: pagination.nextLabel,
        },
      }}
    >
      {rows.map((row, index) => {
        const name = customerDisplayName(row.customer_name)
        const phone = formatPhoneInternational(row.customer_phone)
        const orderLabel =
          formatOrderNumber(row.order_number) ??
          `${t('table.orderFallbackPrefix')} ${row.order_id.slice(0, 8)}`
        const isCanceled = row.status === 'canceled'

        return (
          <IndexTable.Row
            id={row.id}
            key={row.id}
            position={index}
            tone={isNeedsActionRow(row) ? 'warning' : undefined}
          >
            <IndexTable.Cell>
              <div className={cellClassName}>
                <div className="flex items-center gap-2">
                  <OrderNumberLink
                    orderNumber={row.order_number}
                    platform={row.platform}
                    externalOrderId={row.external_order_id}
                    fallback={orderLabel}
                  />
                  {row.is_test && (
                    <Badge tone="info">{t('table.testBadge')}</Badge>
                  )}
                </div>
              </div>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <div className={cellClassName}>
                <BlockStack gap="050">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {name ?? <bdi dir="ltr">{phone || t('table.noPhone')}</bdi>}
                  </Text>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {name ? (
                      <bdi dir="ltr">{phone || t('table.noPhone')}</bdi>
                    ) : (
                      t('confirmations.noName')
                    )}
                  </Text>
                </BlockStack>
              </div>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <div className={cellClassName}>
                <StatusCell row={row} timeZone={timeZone} />
              </div>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <div className={cellClassName}>
                <Text
                  as="span"
                  variant="bodyMd"
                  fontWeight="semibold"
                  tone={isCanceled ? 'subdued' : undefined}
                  textDecorationLine={isCanceled ? 'line-through' : undefined}
                >
                  <bdi dir="ltr">
                    {formatOrderAmount(row.total_price, row.currency, locale)}
                  </bdi>
                </Text>
              </div>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <div className={cellClassName}>
                <Text as="span" variant="bodySm" tone="subdued">
                  {formatUpdatedAt(
                    row.updated_at ?? row.created_at,
                    locale,
                    timeZone
                  )}
                </Text>
              </div>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <div className={cellClassName}>
                <ConfirmationRowActions
                  row={row}
                  orderLabel={orderLabel}
                  canWrite={canWrite}
                  canRetry={canRetry}
                  isActing={actingId === row.id}
                  handlers={handlers}
                />
              </div>
            </IndexTable.Cell>
          </IndexTable.Row>
        )
      })}
    </IndexTable>
  )
}
