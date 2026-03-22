import {
  BlockStack,
  Card,
  InlineGrid,
  Layout,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonPage,
} from '@shopify/polaris'

export function DashboardPageSkeleton() {
  return (
    <SkeletonPage title="Dashboard">
      <BlockStack gap="400">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="300">
                  <SkeletonDisplayText size="small" />
                  <InlineGrid columns={{ xs: 2, sm: 3, md: 5 }} gap="300">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonBodyText key={i} lines={2} />
                    ))}
                  </InlineGrid>
                </BlockStack>
              </Card>

              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <Card>
                  <BlockStack gap="300">
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText lines={2} />
                  </BlockStack>
                </Card>
                <Card>
                  <BlockStack gap="300">
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText lines={2} />
                  </BlockStack>
                </Card>
              </InlineGrid>
            </BlockStack>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText lines={5} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </SkeletonPage>
  )
}
