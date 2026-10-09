import { IndexTable, SkeletonBodyText } from '@shopify/polaris'

const SKELETON_ROW_COUNT = 5
/** One per column of the confirmations table, each a single line. */
const SKELETON_COLUMN_COUNT = 9

export function VerificationsTableSkeleton() {
  return (
    <IndexTable
      itemCount={SKELETON_ROW_COUNT}
      headings={[
        { id: 'skeleton-order', title: '' },
        { id: 'skeleton-order-time', title: '' },
        { id: 'skeleton-customer', title: '' },
        { id: 'skeleton-phone', title: '' },
        { id: 'skeleton-status', title: '' },
        { id: 'skeleton-reminder', title: '' },
        { id: 'skeleton-updated', title: '' },
        { id: 'skeleton-total', title: '' },
        { id: 'skeleton-actions', title: '' },
      ]}
      selectable={false}
      hasZebraStriping
    >
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <IndexTable.Row id={`skeleton-${index}`} key={index} position={index}>
          {Array.from({ length: SKELETON_COLUMN_COUNT }, (_, column) => (
            <IndexTable.Cell key={column}>
              <SkeletonBodyText lines={1} />
            </IndexTable.Cell>
          ))}
        </IndexTable.Row>
      ))}
    </IndexTable>
  )
}
