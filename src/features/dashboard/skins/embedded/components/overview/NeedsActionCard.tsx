import {
  Badge,
  BlockStack,
  Box,
  Card,
  Divider,
  Icon,
  IndexTable,
  InlineStack,
  Link,
  Text,
  useBreakpoints,
} from '@shopify/polaris'
import { CheckCircleIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import type { ManualConfirmationTarget } from '../../../../domain/useManualConfirmation'
import { NEEDS_ACTION_CARD_LIMIT } from '../../../../domain/needsActionRow'
import { useNeedsActionRow } from '../../../../domain/useNeedsActionRow'
import { formatTooltipDateTime } from '../../../../domain/verificationRow'
import {
  customerDisplayName,
  formatCount,
  formatDayAndClock,
  formatOrderAmount,
  formatPhoneInternational,
} from '../../../../lib/orderDisplay'
import type {
  DashboardOverview,
  NeedsActionItem,
} from '../../../../model/dashboard.model'
import {
  AmountText,
  BADGE_TONES,
  CardTimes,
  CustomerCell,
  CustomerNameCell,
  DateTimeCell,
  PhoneCell,
} from '../confirmations/confirmationRowView'
import { OrderNumberLink } from '../shared/OrderNumberLink'
import { NeedsActionRowActions } from './NeedsActionRowActions'

interface RowProps {
  item: NeedsActionItem
  timeZone: string
  canConfirm: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onViewAll: () => void
}

/** Everything a row and a card show, from one item. */
function useRowView({ item, timeZone, canConfirm }: RowProps) {
  const { locale } = useLocaleInfo()
  const row = useNeedsActionRow(item, timeZone, canConfirm)
  const name = customerDisplayName(item.customer_name)
  const phone = formatPhoneInternational(item.customer_phone)
  return {
    row,
    name,
    phone,
    amount: formatOrderAmount(item.total_price, item.currency, locale),
    times: {
      orderTime: formatDayAndClock(item.created_at, locale, timeZone),
      orderTimeTitle: formatTooltipDateTime(
        item.created_at ?? null,
        locale,
        timeZone
      ),
      lastUpdate: formatDayAndClock(item.updated_at, locale, timeZone),
      lastUpdateTitle: formatTooltipDateTime(
        item.updated_at ?? null,
        locale,
        timeZone
      ),
    },
    target: {
      verificationId: item.verification_id,
      orderLabel: row.orderLabel,
    },
  }
}

/** The status column: the table's words and tones, why it waits on hover. */
function NeedsActionStatus({
  row,
}: {
  row: ReturnType<typeof useNeedsActionRow>
}) {
  return (
    <span title={row.reasonText}>
      <Badge tone={BADGE_TONES[row.status.kind]}>{row.badgeText}</Badge>
    </span>
  )
}

function OrderLabel({
  item,
  fallback,
}: {
  item: NeedsActionItem
  fallback: string
}) {
  return (
    <OrderNumberLink
      orderNumber={item.order_number}
      platform={item.platform}
      externalOrderId={item.external_order_id}
      fallback={fallback}
    />
  )
}

function TableRow({
  index,
  cellClassName,
  ...props
}: RowProps & { index: number; cellClassName: string }) {
  const { row, name, phone, amount, times, target } = useRowView(props)
  const cells = [
    <OrderLabel key="order" item={props.item} fallback={row.orderLabel} />,
    <DateTimeCell
      key="orderTime"
      text={times.orderTime}
      title={times.orderTimeTitle}
    />,
    <CustomerNameCell key="customer" name={name} />,
    <PhoneCell key="phone" phone={phone} />,
    <NeedsActionStatus key="status" row={row} />,
    <DateTimeCell
      key="updated"
      text={times.lastUpdate}
      title={times.lastUpdateTitle}
    />,
    <AmountText key="total" amount={amount} isCanceled={false} />,
    <NeedsActionRowActions
      key="action"
      row={row}
      target={target}
      customerLabel={name ?? phone}
      onRequestConfirm={props.onRequestConfirm}
      onViewAll={props.onViewAll}
    />,
  ]
  return (
    <IndexTable.Row
      id={props.item.verification_id}
      position={index}
      tone="warning"
    >
      {cells.map((cell) => (
        <IndexTable.Cell key={cell.key}>
          <div className={cellClassName}>{cell}</div>
        </IndexTable.Cell>
      ))}
    </IndexTable.Row>
  )
}

/** The Confirmations page's narrow-screen card, with the reason written out. */
function CardRow(props: RowProps) {
  const { row, name, phone, amount, times, target } = useRowView(props)
  return (
    <Box
      as="li"
      padding="400"
      borderBlockEndWidth="025"
      borderColor="border"
      background="bg-surface-warning"
    >
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          <OrderLabel item={props.item} fallback={row.orderLabel} />
          <AmountText amount={amount} isCanceled={false} />
        </InlineStack>
        <CustomerCell name={name} phone={phone} />
        <BlockStack gap="150" inlineAlign="start">
          <NeedsActionStatus row={row} />
          <Text as="p" variant="bodySm" tone="subdued">
            {row.reasonText}
          </Text>
        </BlockStack>
        <CardTimes {...times} />
        <NeedsActionRowActions
          row={row}
          target={target}
          customerLabel={name ?? phone}
          onRequestConfirm={props.onRequestConfirm}
          onViewAll={props.onViewAll}
          layout="stacked"
        />
      </BlockStack>
    </Box>
  )
}

const HEADINGS = [
  'order',
  'orderTime',
  'customer',
  'phone',
  'status',
  'updated',
  'total',
  'action',
] as const

/** The confirmations table's columns, less Follow-up: every row here waits. */
function NeedsActionTable({
  items,
  ...rowProps
}: Omit<RowProps, 'item'> & { items: NeedsActionItem[] }) {
  const t = useTranslations('dashboard.confirmations')
  const { isRTL } = useLocaleInfo()
  const alignment = isRTL ? ('end' as const) : undefined
  const cellClassName = isRTL ? 'w-full text-right' : 'w-full'
  const [first, ...rest] = HEADINGS.map((heading) => ({
    title: t(`headings.${heading}`),
    alignment,
  }))

  return (
    <IndexTable
      resourceName={{
        singular: t('resource.singular'),
        plural: t('resource.plural'),
      }}
      itemCount={items.length}
      headings={[first, ...rest]}
      selectable={false}
    >
      {items.map((item, index) => (
        <TableRow
          key={item.verification_id}
          item={item}
          index={index}
          cellClassName={cellClassName}
          {...rowProps}
        />
      ))}
    </IndexTable>
  )
}

/**
 * The orders waiting on the merchant, highest value first (at most three), in
 * the confirmations table's columns and words; narrow screens get its cards.
 */
export function NeedsActionCard({
  needsAction,
  timeZone,
  canConfirm,
  onRequestConfirm,
  onViewAll,
}: {
  needsAction: DashboardOverview['needs_action']
  timeZone: string
  canConfirm: boolean
  onRequestConfirm: (target: ManualConfirmationTarget) => void
  onViewAll: () => void
}) {
  const t = useTranslations('dashboard.overview.needsAction')
  const { locale } = useLocaleInfo()
  // Eight columns do not fit a phone; below md each order becomes a card.
  const { mdUp } = useBreakpoints({ defaults: { mdUp: true } })
  const rowProps = { timeZone, canConfirm, onRequestConfirm, onViewAll }
  const items = needsAction.items.slice(0, NEEDS_ACTION_CARD_LIMIT)

  return (
    <Card padding="0">
      <Box padding="400">
        <InlineStack align="space-between" blockAlign="center" gap="300">
          <InlineStack gap="200" blockAlign="center">
            <Text as="h2" variant="headingLg">
              {t('title')}
            </Text>
            {needsAction.count > 0 && (
              <Badge tone="attention">
                {formatCount(needsAction.count, locale)}
              </Badge>
            )}
            <span className="sr-only">
              {t('countLabel', { count: needsAction.count })}
            </span>
          </InlineStack>
          <Link onClick={onViewAll}>{t('allOrders')}</Link>
        </InlineStack>
      </Box>
      <Divider />
      {items.length === 0 ? (
        <Box padding="600">
          <BlockStack gap="200" inlineAlign="center">
            <span aria-hidden="true">
              <Icon source={CheckCircleIcon} tone="success" />
            </span>
            <Text as="p" variant="headingMd" alignment="center">
              {t('empty')}
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
              {t('emptyBody')}
            </Text>
          </BlockStack>
        </Box>
      ) : mdUp ? (
        <NeedsActionTable items={items} {...rowProps} />
      ) : (
        <ul className="m-0 list-none p-0">
          {items.map((item) => (
            <CardRow key={item.verification_id} item={item} {...rowProps} />
          ))}
        </ul>
      )}
    </Card>
  )
}
