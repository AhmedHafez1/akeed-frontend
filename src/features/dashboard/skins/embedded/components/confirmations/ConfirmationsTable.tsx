import { Badge, IndexTable, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { isNeedsActionRow } from '../../../../domain/confirmationRowStatus'
import { formatUpdatedAt } from '../../../../lib/orderDisplay'
import type { VerificationItem } from '../../../../model/dashboard.model'
import { OrderNumberLink } from '../shared/OrderNumberLink'
import { ConfirmationRowActions } from './ConfirmationRowActions'
import {
  AmountText,
  CustomerCell,
  StatusCell,
  useConfirmationRowView,
  type ConfirmationsListProps,
} from './confirmationRowView'

type RowProps = Omit<ConfirmationsListProps, 'rows' | 'pagination'> & {
  row: VerificationItem
  index: number
  cellClassName: string
}

function ConfirmationsTableRow({
  row,
  index,
  cellClassName,
  timeZone,
  canWrite,
  canRetry,
  actingId,
  handlers,
}: RowProps) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const view = useConfirmationRowView(row)

  return (
    <IndexTable.Row
      id={row.id}
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
              fallback={view.orderLabel}
            />
            {row.is_test && <Badge tone="info">{t('table.testBadge')}</Badge>}
          </div>
        </div>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <div className={cellClassName}>
          <CustomerCell name={view.name} phone={view.phone} />
        </div>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <div className={cellClassName}>
          <StatusCell row={row} timeZone={timeZone} />
        </div>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <div className={cellClassName}>
          <AmountText amount={view.amount} isCanceled={view.isCanceled} />
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
            orderLabel={view.orderLabel}
            canWrite={canWrite}
            canRetry={canRetry}
            isActing={actingId === row.id}
            handlers={handlers}
          />
        </div>
      </IndexTable.Cell>
    </IndexTable.Row>
  )
}

/**
 * The confirmations table: six columns, the status and its sub-line in one,
 * needs-action rows tinted amber, and paging in the footer. Narrow screens
 * get `ConfirmationsCardList` instead.
 */
export function ConfirmationsTable({
  rows,
  pagination,
  ...rowProps
}: ConfirmationsListProps) {
  const t = useTranslations('dashboard')
  const { isRTL } = useLocaleInfo()
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
      {rows.map((row, index) => (
        <ConfirmationsTableRow
          key={row.id}
          row={row}
          index={index}
          cellClassName={cellClassName}
          {...rowProps}
        />
      ))}
    </IndexTable>
  )
}
