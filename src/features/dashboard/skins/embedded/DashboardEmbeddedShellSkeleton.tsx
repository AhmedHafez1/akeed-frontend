import { BlockStack, InlineStack, Page, SkeletonBodyText } from '@shopify/polaris'
import { DashboardPageSkeleton } from '@/shared/layout/skeletons'

interface DashboardEmbeddedShellSkeletonProps {
  variant: 'stats' | 'verifications'
}

export function DashboardEmbeddedShellSkeleton({
  variant,
}: DashboardEmbeddedShellSkeletonProps) {
  return (
    <Page title="Dashboard">
      <BlockStack gap="500">
        <InlineStack align="space-between" blockAlign="center" gap="300" wrap>
          <InlineStack gap="200" wrap>
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="w-24">
                <SkeletonBodyText lines={1} />
              </div>
            ))}
          </InlineStack>
          <div className="w-36">
            <SkeletonBodyText lines={1} />
          </div>
        </InlineStack>

        <DashboardPageSkeleton variant={variant} showPageChrome={false} />
      </BlockStack>
    </Page>
  )
}
