import type { MouseEvent } from 'react'
import { Badge, BlockStack, Box, InlineStack, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { isNeedsActionRow } from '../../../../domain/confirmationRowStatus'
import { useCustomerRecordView } from '../../../../domain/useCustomerRecordView'
import type { VerificationItem } from '../../../../model/dashboard.model'
import { OrderNumberLink } from '../shared/OrderNumberLink'
import { ConfirmationRowActions } from './ConfirmationRowActions'
import {
  AmountText,
  FollowUpCell,
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

/**
 * Clicks on the card's own link and buttons do their own thing. The "…" sheet
 * is portalled, so its clicks bubble here through React though they are not
 * on the card; those are ignored too.
 */
function isFromControl(event: MouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement
  return (
    !event.currentTarget.contains(target) ||
    target.closest('a, button') !== null
  )
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
          if (!isFromControl(event)) handlers.onOpenDetails(row)
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

          <FollowUpCell row={row} timeZone={timeZone} showTime />

          <InlineStack
            align="space-between"
            blockAlign="center"
            wrap={false}
            gap="200"
          >
            <BlockStack gap="050">
              {/* Block wrappers, so each line keeps the small text's own
                  line height. */}
              <div title={view.orderTimeTitle || undefined}>
                <Text as="p" variant="bodySm" tone="subdued">
                  {t('confirmations.card.ordered', { time: view.orderTime })}
                </Text>
              </div>
              <div title={view.lastUpdateTitle || undefined}>
                <Text as="p" variant="bodySm" tone="subdued">
                  {t('confirmations.card.updated', { time: view.lastUpdate })}
                </Text>
              </div>
            </BlockStack>
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
