import type { ReactNode } from 'react'
import { BlockStack, Card, InlineGrid, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  formatCount,
  formatOrderAmount,
  formatPercent,
} from '../../../../lib/orderDisplay'
import type { DashboardOverview } from '../../../../model/dashboard.model'

function KpiCard({
  title,
  value,
  body,
}: {
  title: string
  value: string
  body: ReactNode
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
        <Text as="p" variant="bodyMd" tone="subdued">
          {body}
        </Text>
      </BlockStack>
    </Card>
  )
}

/** The three numbers a merchant cares about, in equal columns. */
export function KpiCards({ kpis }: { kpis: DashboardOverview['kpis'] }) {
  const t = useTranslations('dashboard.overview.kpis')
  const { locale } = useLocaleInfo()
  const [topValue] = kpis.confirmed.value
  const rate = kpis.confirmation_rate

  return (
    <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
      <KpiCard
        title={t('confirmed.title')}
        value={formatCount(kpis.confirmed.count, locale)}
        body={
          topValue
            ? t.rich('confirmed.value', {
                amount: () => (
                  <bdi dir="ltr" className="font-semibold">
                    {formatOrderAmount(
                      topValue.amount,
                      topValue.currency,
                      locale
                    )}
                  </bdi>
                ),
              })
            : t('confirmed.none')
        }
      />
      <KpiCard
        title={t('canceled.title')}
        value={formatCount(kpis.canceled_before_shipping.count, locale)}
        body={t('canceled.body', {
          count: kpis.canceled_before_shipping.count,
        })}
      />
      <KpiCard
        title={t('rate.title')}
        value={formatPercent(rate.rate, locale)}
        body={
          rate.sent > 0
            ? t('rate.body', { confirmed: rate.confirmed, sent: rate.sent })
            : t('rate.none')
        }
      />
    </InlineGrid>
  )
}
