import {
  BlockStack,
  Box,
  Card,
  InlineGrid,
  InlineStack,
  Layout,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonPage,
} from '@shopify/polaris'

interface SettingsPageSkeletonProps {
  variant?: 'store' | 'confirmation' | 'message-preview' | 'billing'
  showPageChrome?: boolean
}

function FieldSkeleton() {
  return (
    <BlockStack gap="100">
      <div className="w-40">
        <SkeletonBodyText lines={1} />
      </div>
      <SkeletonBodyText lines={1} />
    </BlockStack>
  )
}

function HeaderSkeleton() {
  return (
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
  )
}

function StoreConfigurationSkeleton() {
  return (
    <Card>
      <BlockStack gap="400">
        <SkeletonDisplayText size="small" />
        {Array.from({ length: 4 }).map((_, index) => (
          <FieldSkeleton key={index} />
        ))}
      </BlockStack>
    </Card>
  )
}

function AutomationSkeleton() {
  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="150">
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={1} />
        </BlockStack>

        <SkeletonBodyText lines={2} />
        <FieldSkeleton />

        <div className="h-px bg-gray-200" />

        <SkeletonBodyText lines={2} />
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <FieldSkeleton />
          <FieldSkeleton />
        </InlineGrid>

        <div className="h-px bg-gray-200" />

        <SkeletonBodyText lines={2} />
        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </InlineGrid>

        <div className="w-28">
          <SkeletonBodyText lines={1} />
        </div>
      </BlockStack>
    </Card>
  )
}

function MessagePreviewSkeleton() {
  return (
    <Card>
      <BlockStack gap="300">
        <SkeletonDisplayText size="small" />
        <SkeletonBodyText lines={4} />
        <SkeletonBodyText lines={2} />
      </BlockStack>
    </Card>
  )
}

function SubscriptionSkeleton() {
  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={1} />
        </BlockStack>

        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center" gap="300">
            <div className="w-40">
              <SkeletonBodyText lines={1} />
            </div>
            <div className="w-24">
              <SkeletonBodyText lines={1} />
            </div>
          </InlineStack>
          <div className="h-2 rounded-full bg-gray-200" />
          <SkeletonBodyText lines={1} />
        </BlockStack>

        <InlineGrid columns={{ xs: 1, md: 2, xl: 4 }} gap="300">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-gray-200 p-4">
              <BlockStack gap="300">
                <SkeletonBodyText lines={1} />
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText lines={1} />
              </BlockStack>
            </div>
          ))}
        </InlineGrid>

        <div className="w-36">
          <SkeletonBodyText lines={1} />
        </div>
      </BlockStack>
    </Card>
  )
}

export function SettingsPageSkeleton({
  variant = 'store',
  showPageChrome = true,
}: SettingsPageSkeletonProps) {
  const content = (
    <BlockStack gap="500">
      <HeaderSkeleton />
      <Layout>
        <Layout.Section>
          {variant === 'store' && <StoreConfigurationSkeleton />}
          {variant === 'confirmation' && <AutomationSkeleton />}
          {variant === 'message-preview' && <MessagePreviewSkeleton />}
          {variant === 'billing' && <SubscriptionSkeleton />}
        </Layout.Section>
      </Layout>
      <Box padding="200" />
    </BlockStack>
  )

  if (!showPageChrome) {
    return content
  }

  return <SkeletonPage title="Settings">{content}</SkeletonPage>
}
