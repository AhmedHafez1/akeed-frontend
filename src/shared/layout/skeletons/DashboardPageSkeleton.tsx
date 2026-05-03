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

interface DashboardPageSkeletonProps {
  variant: 'stats' | 'verifications'
}

function HeaderControlsSkeleton() {
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

function MetricCardsSkeleton() {
  return (
    <BlockStack gap="400">
      {Array.from({ length: 2 }).map((_, rowIndex) => (
        <InlineGrid key={rowIndex} columns={{ xs: 1, md: 3 }} gap="400">
          {Array.from({ length: 3 }).map((__, cardIndex) => (
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
      ))}
    </BlockStack>
  )
}

function FunnelSkeleton() {
  return (
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
                <SkeletonBodyText lines={1} />
                <SkeletonDisplayText size="small" />
              </BlockStack>
            </div>
          ))}
        </InlineGrid>
      </BlockStack>
    </Card>
  )
}

function VerificationsSectionSkeleton() {
  return (
    <Card>
      <BlockStack gap="400">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <BlockStack gap="100">
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={1} />
          </BlockStack>

          <div className="w-full md:hidden">
            <SkeletonBodyText lines={1} />
          </div>

          <div className="hidden md:flex md:flex-wrap md:justify-end md:gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="w-20">
                <SkeletonBodyText lines={1} />
              </div>
            ))}
          </div>
        </div>

        <BlockStack gap="300">
          {Array.from({ length: 5 }).map((_, index) => (
            <InlineGrid key={index} columns={{ xs: 1, md: 6 }} gap="300">
              <SkeletonBodyText lines={2} />
              <SkeletonBodyText lines={2} />
              <SkeletonBodyText lines={1} />
              <SkeletonBodyText lines={1} />
              <SkeletonBodyText lines={2} />
              <SkeletonBodyText lines={1} />
            </InlineGrid>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  )
}

export function DashboardPageSkeleton({ variant }: DashboardPageSkeletonProps) {
  return (
    <SkeletonPage title={variant === 'stats' ? 'Dashboard' : 'Verifications'}>
      <BlockStack gap="500">
        <HeaderControlsSkeleton />

        <Layout>
          <Layout.Section>
            {variant === 'stats' ? (
              <BlockStack gap="400">
                <MetricCardsSkeleton />
                <FunnelSkeleton />
              </BlockStack>
            ) : (
              <VerificationsSectionSkeleton />
            )}
          </Layout.Section>
        </Layout>
      </BlockStack>
    </SkeletonPage>
  )
}
