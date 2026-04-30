import {
  BlockStack,
  Card,
  InlineGrid,
  SkeletonBodyText,
  SkeletonDisplayText,
} from '@shopify/polaris'

export function StatsEmbeddedSkeleton() {
  return (
    <BlockStack gap="400">
      <InlineGrid columns={{ xs: 1, md: 5 }} gap="400">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <BlockStack gap="300">
              <SkeletonDisplayText size="medium" />
              <SkeletonBodyText lines={1} />
            </BlockStack>
          </Card>
        ))}
      </InlineGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <BlockStack gap="300">
            <SkeletonDisplayText size="small" />
            <InlineGrid columns={{ xs: 1, md: 4 }} gap="300">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBodyText key={index} lines={3} />
              ))}
            </InlineGrid>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={2} />
          </BlockStack>
        </Card>
      </div>
    </BlockStack>
  )
}
