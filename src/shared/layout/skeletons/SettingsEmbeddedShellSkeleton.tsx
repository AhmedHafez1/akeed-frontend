import { BlockStack, InlineStack, Page, SkeletonBodyText } from '@shopify/polaris'
import { SettingsPageSkeleton } from './SettingsPageSkeleton'

interface SettingsEmbeddedShellSkeletonProps {
  variant: 'store' | 'confirmation' | 'message-preview' | 'billing'
}

export function SettingsEmbeddedShellSkeleton({
  variant,
}: SettingsEmbeddedShellSkeletonProps) {
  return (
    <Page title="Settings">
      <BlockStack gap="500">
        <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
          <InlineStack gap="200" wrap>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="w-20">
                <SkeletonBodyText lines={1} />
              </div>
            ))}
          </InlineStack>
          <div className="w-24">
            <SkeletonBodyText lines={1} />
          </div>
        </InlineStack>

        <SettingsPageSkeleton variant={variant} showPageChrome={false} />
      </BlockStack>
    </Page>
  )
}
