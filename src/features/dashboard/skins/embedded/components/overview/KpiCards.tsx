import type { ReactNode } from 'react'
import { BlockStack, Card, InlineGrid, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { useKpiDetails } from '../../../../domain/useKpiDetails'
import { formatCount, formatPercent } from '../../../../lib/orderDisplay'
import type { DashboardOverview } from '../../../../model/dashboard.model'

function KpiCard({
  title,
  value,
  detail,
}: {
  title: string
  value: string
  detail?: ReactNode
}) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h2" variant="bodyMd" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="heading2xl">
          <bdi dir="ltr">{value}</bdi>
        </Text>
        {detail && (
          <Text as="p" variant="bodySm" tone="subdued">
            {detail}
          </Text>
        )}
      </BlockStack>
    </Card>
  )
}

/** The three numbers a merchant cares about, in equal columns. */
export function KpiCards({ kpis }: { kpis: DashboardOverview['kpis'] }) {
  const t = useTranslations('dashboard.overview.kpis')
  const { locale } = useLocaleInfo()
  const details = useKpiDetails(kpis)

  return (
    <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
      <KpiCard
        title={t('confirmed.title')}
        value={formatCount(kpis.confirmed.count, locale)}
        detail={details.confirmed}
      />
      <KpiCard
        title={t('canceled.title')}
        value={formatCount(kpis.canceled_before_shipping.count, locale)}
      />
      <KpiCard
        title={t('rate.title')}
        value={formatPercent(kpis.confirmation_rate.rate, locale)}
        detail={details.rate}
      />
    </InlineGrid>
  )
}
