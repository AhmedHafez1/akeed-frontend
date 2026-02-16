import {
  Badge,
  Banner,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  EmptyState as PolarisEmptyState,
  InlineStack,
  Layout,
  Page,
  Spinner,
  Text,
} from '@shopify/polaris'
import { VerificationsTableEmbedded } from './VerificationsTableEmbedded'
import { StatsEmbedded } from './StatsEmbedded'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

export function DashboardEmbeddedSkin({
  stats,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  verifications,
  isVerificationsLoading,
  hasVerifications,
  emptyVerificationsMessage,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
  error,
}: DashboardSkinProps) {
  return (
    <Page
      title="Dashboard"
      subtitle="Monitor verification status and recent orders across your channels."
    >
      <BlockStack gap="400">
        {error && (
          <Banner tone="critical" onDismiss={() => {}}>
            <p>{error}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <StatsEmbedded
              stats={stats}
              isStatsLoading={isStatsLoading}
              dateRangeFilter={dateRangeFilter}
              dateRangeOptions={dateRangeOptions}
              onDateRangeFilterChange={onDateRangeFilterChange}
            />
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <InlineStack
                  align="space-between"
                  blockAlign="center"
                  gap="300"
                >
                  <BlockStack gap="100">
                    <InlineStack gap="200" blockAlign="center">
                      <Text variant="headingMd" as="h2">
                        Verification Status
                      </Text>
                      <Badge tone="info">Live</Badge>
                    </InlineStack>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Latest verification events across your active channels.
                    </Text>
                  </BlockStack>

                  <ButtonGroup>
                    {statusFilters.map((filter) => (
                      <Button
                        key={filter.id}
                        pressed={statusFilter === filter.id}
                        onClick={() => onStatusFilterChange(filter.id)}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </ButtonGroup>
                </InlineStack>

                {isVerificationsLoading ? (
                  <InlineStack align="center" gap="200">
                    <Spinner size="small" />
                    <Text variant="bodySm" tone="subdued" as="span">
                      Loading verifications...
                    </Text>
                  </InlineStack>
                ) : hasVerifications ? (
                  <VerificationsTableEmbedded verifications={verifications} />
                ) : (
                  <PolarisEmptyState
                    heading="No verifications"
                    image={null as unknown as string}
                  >
                    <p>{emptyVerificationsMessage}</p>
                  </PolarisEmptyState>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  )
}
