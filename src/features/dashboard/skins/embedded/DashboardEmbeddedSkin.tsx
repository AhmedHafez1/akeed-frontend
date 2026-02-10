import {
  Page,
  Layout,
  Card,
  Text,
  ButtonGroup,
  Button,
  Spinner,
  EmptyState as PolarisEmptyState,
  Banner,
  BlockStack,
  InlineStack,
} from '@shopify/polaris'
import { VerificationsTableEmbedded } from './VerificationsTableEmbedded'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

/**
 * Dashboard Embedded Skin
 *
 * Renders the full dashboard UI using Shopify Polaris components.
 * Used inside the Shopify Admin iframe — NO Tailwind classes allowed here.
 *
 * This component is purely presentational:
 *  - Receives all data and handlers via DashboardSkinProps
 *  - Contains zero business logic
 */
export function DashboardEmbeddedSkin({
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
      <BlockStack gap="500">
        {/* ── Error banner ──────────────────────────────────────────── */}
        {error && (
          <Banner tone="critical" onDismiss={() => {}}>
            <p>{error}</p>
          </Banner>
        )}

        {/* ── Verifications section ─────────────────────────────────── */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2">
                      Verification Status
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Track pending, sent, confirmed, and canceled verification
                      flows.
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
                  <InlineStack align="center">
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
