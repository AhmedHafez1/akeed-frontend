import {
  BlockStack,
  Card,
  Layout,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonPage,
} from '@shopify/polaris'

export function OnboardingPageSkeleton() {
  return (
    <SkeletonPage title="Onboarding">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <SkeletonBodyText lines={1} />
                <SkeletonDisplayText size="small" />
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
