import { InlineStack, SkeletonBodyText } from '@shopify/polaris'

export function StatsEmbeddedSkeletonHeader() {
  return (
    <InlineStack align="space-between" blockAlign="center" gap="300" wrap>
      <InlineStack gap="200" wrap>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="w-24">
            <SkeletonBodyText lines={1} />
          </div>
        ))}
      </InlineStack>
      <div className="w-36">
        <SkeletonBodyText lines={1} />
      </div>
    </InlineStack>
  )
}
