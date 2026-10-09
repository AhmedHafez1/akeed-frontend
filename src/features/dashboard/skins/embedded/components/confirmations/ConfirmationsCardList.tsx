import { Badge, BlockStack, Box, InlineStack } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { isNeedsActionRow } from '../../../../domain/confirmationRowStatus'
import type { VerificationItem } from '../../../../model/dashboard.model'
import { OrderNumberLink } from '../shared/OrderNumberLink'
import { ConfirmationRowActions } from './ConfirmationRowActions'
import {
  AmountText,
  CardTimes,
  CustomerCell,
  FollowUpCell,
  StatusCell,
  useConfirmationRowView,
  type ConfirmationsListProps,
} from './confirmationRowView'

type CardProps = Omit<ConfirmationsListProps, 'rows'> & {
  row: VerificationItem
}

function ConfirmationCard({
  row,
  timeZone,
  canWrite,
  canRetry,
  actingId,
  handlers,
}: CardProps) {
  const t = useTranslations('dashboard')
  const view = useConfirmationRowView(row, timeZone)

  return (
    <Box
      as="li"
      padding="400"
      borderBlockEndWidth="025"
      borderColor="border"
      background={isNeedsActionRow(row) ? 'bg-surface-warning' : undefined}
    >
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          <InlineStack gap="200" blockAlign="center">
            <OrderNumberLink
              orderNumber={row.order_number}
              platform={row.platform}
              externalOrderId={row.external_order_id}
              fallback={view.orderLabel}
            />
            {row.is_test && <Badge tone="info">{t('table.testBadge')}</Badge>}
          </InlineStack>
          <AmountText amount={view.amount} isCanceled={view.isCanceled} />
        </InlineStack>

        <InlineStack align="space-between" blockAlign="start" wrap={false}>
          <CustomerCell name={view.name} phone={view.phone} />
          <BlockStack gap="150" inlineAlign="end">
            <StatusCell row={row} timeZone={timeZone} />
            <FollowUpCell row={row} timeZone={timeZone} showTime />
          </BlockStack>
        </InlineStack>

        <CardTimes
          orderTime={view.orderTime}
          orderTimeTitle={view.orderTimeTitle}
          lastUpdate={view.lastUpdate}
          lastUpdateTitle={view.lastUpdateTitle}
        />

        <ConfirmationRowActions
          row={row}
          orderLabel={view.orderLabel}
          canWrite={canWrite}
          canRetry={canRetry}
          isActing={actingId === row.id}
          handlers={handlers}
          layout="stacked"
        />
      </BlockStack>
    </Box>
  )
}

/**
 * The confirmations list for narrow screens: one card per order with the
 * same values and actions as a table row.
 */
export function ConfirmationsCardList({
  rows,
  ...cardProps
}: ConfirmationsListProps) {
  return (
    <Box as="ul">
      {rows.map((row) => (
        <ConfirmationCard key={row.id} row={row} {...cardProps} />
      ))}
    </Box>
  )
}
