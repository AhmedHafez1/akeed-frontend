import { Banner, BlockStack, Layout, Page } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { StatsEmbedded } from './StatsEmbedded'
import type { DashboardSkinProps } from '../../domain/dashboard.types'

export function DashboardEmbeddedSkin({
  stats,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  testFeedback,
  onDismissTestFeedback,
  error,
}: DashboardSkinProps) {
  const t = useTranslations('dashboard')

  return (
    <Page title={t('title')} subtitle={t('valueProposition')}>
      <BlockStack gap="500">
        {error && (
          <Banner tone="critical">
            <p>{error}</p>
          </Banner>
        )}

        {testFeedback && (
          <Banner tone={testFeedback.tone} onDismiss={onDismissTestFeedback}>
            <p>{testFeedback.message}</p>
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
      </BlockStack>
    </Page>
  )
}
