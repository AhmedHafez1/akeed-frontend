import {
  BlockStack,
  Card,
  InlineGrid,
  InlineStack,
  SkeletonBodyText,
  SkeletonDisplayText,
} from '@shopify/polaris'

export function StatsEmbeddedSkeleton() {
  return (
    <BlockStack gap="400">
      {Array.from({ length: 2 }).map((_, rowIndex) => (
        <BlockStack key={rowIndex} gap="200">
          <div className="w-36">
            <SkeletonBodyText lines={1} />
          </div>
          <InlineGrid columns={{ xs: 1, md: 4 }} gap="400">
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <Card key={`${rowIndex}-${cardIndex}`}>
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <div className="h-2 w-2 rounded-full bg-gray-200" />
                    <div className="w-28">
                      <SkeletonBodyText lines={1} />
                    </div>
                  </InlineStack>
                  <SkeletonDisplayText size="medium" />
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        </BlockStack>
      ))}

      <Card padding={{ lg: '500', xs: '300' }}>
        <BlockStack gap="400">
          <BlockStack gap="150">
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={1} />
          </BlockStack>

          <InlineGrid columns={{ xs: 1, md: 4 }} gap="300">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <div className="h-4 w-4 rounded-full bg-gray-200" />
                    <SkeletonBodyText lines={1} />
                  </InlineStack>
                  <SkeletonDisplayText size="small" />
                </BlockStack>
              </div>
            ))}
          </InlineGrid>
        </BlockStack>
      </Card>
    </BlockStack>
  )
}
