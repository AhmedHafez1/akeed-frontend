import {
  BlockStack,
  InlineStack,
  Page,
  SkeletonBodyText,
} from '@shopify/polaris'
import { DashboardPageSkeleton } from '@/shared/layout/skeletons'
import { ConfirmationsShellSkeleton } from './components/ConfirmationsShellSkeleton'

interface DashboardEmbeddedShellSkeletonProps {
  variant: 'stats' | 'verifications' | 'confirmations'
}

export function DashboardEmbeddedShellSkeleton({
  variant,
}: DashboardEmbeddedShellSkeletonProps) {
  if (variant === 'confirmations') return <ConfirmationsShellSkeleton />

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
