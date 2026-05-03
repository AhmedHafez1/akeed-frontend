import { IndexTable, SkeletonBodyText } from '@shopify/polaris'

const SKELETON_ROW_COUNT = 5

export function VerificationsTableSkeleton() {
  return (
    <IndexTable
      itemCount={SKELETON_ROW_COUNT}
      headings={[
        { id: 'skeleton-order', title: '' },
        { id: 'skeleton-customer', title: '' },
        { id: 'skeleton-status', title: '' },
        { id: 'skeleton-total', title: '' },
        { id: 'skeleton-created', title: '' },
        { id: 'skeleton-actions', title: '' },
      ]}
      selectable={false}
      hasZebraStriping
    >
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <IndexTable.Row id={`skeleton-${index}`} key={index} position={index}>
          <IndexTable.Cell>
            <SkeletonBodyText lines={2} />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <SkeletonBodyText lines={2} />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <SkeletonBodyText lines={1} />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <SkeletonBodyText lines={1} />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <SkeletonBodyText lines={2} />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <SkeletonBodyText lines={1} />
          </IndexTable.Cell>
        </IndexTable.Row>
      ))}
    </IndexTable>
  )
}
