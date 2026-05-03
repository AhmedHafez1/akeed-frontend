import {
  BlockStack,
  Card,
  InlineGrid,
  InlineStack,
  Layout,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonPage,
} from '@shopify/polaris'

interface OnboardingPageSkeletonProps {
  variant?: 'setup' | 'billing'
}

function StepCounterSkeleton() {
  return (
    <BlockStack gap="200">
      <div className="w-28">
        <SkeletonBodyText lines={1} />
      </div>
      <InlineStack gap="200" wrap>
        {Array.from({ length: 4 }).map((_, index) => (
          <InlineStack key={index} gap="200" blockAlign="center">
            <div className="w-24 rounded-md border border-gray-200 px-3 py-1">
              <SkeletonBodyText lines={1} />
            </div>
            {index < 3 && (
              <div className="w-4">
                <SkeletonBodyText lines={1} />
              </div>
            )}
          </InlineStack>
        ))}
      </InlineStack>
    </BlockStack>
  )
}

function ConfigurationStepSkeleton() {
  return (
    <BlockStack gap="400">
      <SkeletonDisplayText size="small" />
      {Array.from({ length: 3 }).map((_, index) => (
        <BlockStack key={index} gap="100">
          <div className="w-36">
            <SkeletonBodyText lines={1} />
          </div>
          <SkeletonBodyText lines={1} />
        </BlockStack>
      ))}
      <div className="rounded-lg border border-gray-200 p-4">
        <SkeletonBodyText lines={3} />
      </div>
      <InlineStack align="end">
        <div className="w-32">
          <SkeletonBodyText lines={1} />
        </div>
      </InlineStack>
    </BlockStack>
  )
}

function BillingStepSkeleton() {
  return (
    <BlockStack gap="400">
      <BlockStack gap="200">
        <SkeletonDisplayText size="small" />
        <SkeletonBodyText lines={2} />
      </BlockStack>

      <div className="rounded-lg border border-gray-200 p-4">
        <SkeletonBodyText lines={5} />
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <SkeletonBodyText lines={1} />
      </div>

      <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4">
            <BlockStack gap="300">
              <SkeletonBodyText lines={1} />
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={3} />
            </BlockStack>
          </div>
        ))}
      </InlineGrid>

      <InlineStack align="space-between" blockAlign="center" gap="400">
        <div className="w-24">
          <SkeletonBodyText lines={1} />
        </div>
        <div className="w-36">
          <SkeletonBodyText lines={1} />
        </div>
      </InlineStack>
    </BlockStack>
  )
}

export function OnboardingPageSkeleton({
  variant = 'setup',
}: OnboardingPageSkeletonProps) {
  return (
    <SkeletonPage title="Onboarding">
      <Layout>
        <Layout.Section>
          <Card
            padding={
              variant === 'billing' ? { xs: '400', md: '800' } : undefined
            }
          >
            <BlockStack gap="400">
              <StepCounterSkeleton />
              {variant === 'billing' ? (
                <BillingStepSkeleton />
              ) : (
                <ConfigurationStepSkeleton />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  )
}
