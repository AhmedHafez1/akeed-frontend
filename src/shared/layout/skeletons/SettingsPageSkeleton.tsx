import {
  BlockStack,
  Card,
  Layout,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonPage,
} from '@shopify/polaris'

export function SettingsPageSkeleton() {
  return (
    <SkeletonPage title="Settings">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText lines={1} />
                <SkeletonBodyText lines={1} />
                <SkeletonBodyText lines={1} />
                <SkeletonBodyText lines={1} />
                <SkeletonBodyText lines={1} />
                <SkeletonBodyText lines={1} />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText lines={2} />
                <SkeletonBodyText lines={3} />
                <SkeletonBodyText lines={1} />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  )
}
