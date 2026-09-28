import {
  Badge,
  BlockStack,
  Box,
  InlineStack,
  Pagination,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { isNeedsActionRow } from '../../../../domain/confirmationRowStatus'
import type { VerificationItem } from '../../../../model/dashboard.model'
import { OrderNumberLink } from '../shared/OrderNumberLink'
import { ConfirmationRowActions } from './ConfirmationRowActions'
import {
  AmountText,
  CustomerCell,
  FollowUpCell,
  StatusCell,
  useConfirmationRowView,
  type ConfirmationsListProps,
} from './confirmationRowView'

type CardProps = Omit<ConfirmationsListProps, 'rows' | 'pagination'> & {
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
  const view = useConfirmationRowView(row)

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

        <InlineStack align="space-between" blockAlign="start" gap="300">
          <CustomerCell name={view.name} phone={view.phone} />
          <BlockStack gap="200">
            <StatusCell row={row} timeZone={timeZone} />
            <FollowUpCell row={row} timeZone={timeZone} showTime />
          </BlockStack>
        </InlineStack>

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
 * same values and actions as a table row, and the same paging.
 */
export function ConfirmationsCardList({
  rows,
  pagination,
  ...cardProps
}: ConfirmationsListProps) {
  return (
    <BlockStack>
      <Box as="ul">
        {rows.map((row) => (
          <ConfirmationCard key={row.id} row={row} {...cardProps} />
        ))}
      </Box>
      <Box padding="300">
        <InlineStack align="center">
          <Pagination
            label={pagination.label}
            hasNext={pagination.hasNext}
            hasPrevious={pagination.hasPrevious}
            onNext={pagination.onNext}
            onPrevious={pagination.onPrevious}
            accessibilityLabels={{
              previous: pagination.previousLabel,
              next: pagination.nextLabel,
            }}
          />
        </InlineStack>
      </Box>
    </BlockStack>
  )
}
