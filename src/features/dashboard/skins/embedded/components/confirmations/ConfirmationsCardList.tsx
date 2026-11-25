import { Badge, BlockStack, Box, InlineStack, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { isNeedsActionRow } from '../../../../domain/confirmationRowStatus'
import { showsShippingLine } from '../../../../domain/shippingStatus'
import { useCustomerRecordView } from '../../../../domain/useCustomerRecordView'
import type { VerificationItem } from '../../../../model/dashboard.model'
import { OrderNumberLink } from '../shared/OrderNumberLink'
import { ConfirmationRowActions } from './ConfirmationRowActions'
import {
  AmountText,
  FollowUpCell,
  isCardControlClick,
  ShippingCell,
  StackedCardTimes,
  StatusCell,
  useConfirmationRowView,
  type ConfirmationsListProps,
} from './confirmationRowView'

type CardProps = Omit<ConfirmationsListProps, 'rows'> & {
  row: VerificationItem
}

/**
 * The phone, then the customer's record as quiet text. A customer who has
 * left orders unconfirmed keeps the amber badge.
 */
function CardCustomer({
  name,
  phone,
  history,
}: {
  name: string | null
  phone: string
  history: VerificationItem['customer_history']
}) {
  const t = useTranslations('dashboard')
  const record = useCustomerRecordView(history)
  const shown = record?.showInList ? record : null
  const phoneText = <bdi dir="ltr">{phone || t('table.noPhone')}</bdi>
  return (
    <BlockStack gap="050">
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        {name ?? phoneText}
      </Text>
      <Text as="span" variant="bodySm" tone="subdued">
        {name ? phoneText : t('confirmations.noName')}
      </Text>
      {shown &&
        (shown.kind === 'risk' ? (
          <span title={shown.summary}>
            <Badge tone="warning">{shown.label}</Badge>
          </span>
        ) : (
          <div title={shown.summary}>
            <Text as="p" variant="bodySm" tone="subdued">
              {shown.label}
            </Text>
          </div>
        ))}
    </BlockStack>
  )
}

function ConfirmationCard({
  row,
  timeZone,
  canWrite,
  canRetry,
  actingId,
  handlers,
  showShipping,
}: CardProps) {
  const t = useTranslations('dashboard')
  const view = useConfirmationRowView(row, timeZone)

  return (
    <Box
      as="li"
      paddingBlockStart="300"
      paddingBlockEnd="300"
      paddingInline="400"
      borderBlockEndWidth="025"
      borderColor="border"
      background={isNeedsActionRow(row) ? 'bg-surface-warning' : undefined}
    >
      {/* A tap anywhere else on the card opens its details; keyboard users
          reach the same details through "…". The extra 5px gives the
          bottom line room. */}
      <div
        className="cursor-pointer pb-[5px]"
        onClick={(event) => {
          if (!isCardControlClick(event)) handlers.onOpenDetails(row)
        }}
      >
        <BlockStack gap="200">
          <InlineStack
            align="space-between"
            blockAlign="center"
            wrap={false}
            gap="200"
          >
            <InlineStack gap="200" blockAlign="center" wrap={false}>
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

          <InlineStack
            align="space-between"
            blockAlign="start"
            wrap={false}
            gap="200"
          >
            <CardCustomer
              name={view.name}
              phone={view.phone}
              history={row.customer_history}
            />
            <div className="shrink-0 whitespace-nowrap">
              <StatusCell row={row} timeZone={timeZone} />
            </div>
          </InlineStack>

          {/* Its own short line, like the reminder's: a phone has no room
              beside the status for a long word such as "WhatsApp undeliverable". */}
          {showShipping && showsShippingLine(row) && (
            <ShippingCell row={row} timeZone={timeZone} withLabel />
          )}

          <FollowUpCell row={row} timeZone={timeZone} showTime />

          <InlineStack
            align="space-between"
            blockAlign="center"
            wrap={false}
            gap="200"
          >
            <StackedCardTimes
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
            />
          </InlineStack>
        </BlockStack>
      </div>
    </Box>
  )
}

/**
 * The confirmations list for narrow screens: one card per order with the
 * same values as a table row. Every action, the WhatsApp link included, sits
 * behind "…" at the end of the card, as in the table.
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
