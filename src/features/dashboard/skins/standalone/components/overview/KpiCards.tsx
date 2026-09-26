'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Card } from '@/shared/ui'
import {
  formatCount,
  formatOrderAmount,
  formatPercent,
} from '@/features/dashboard/lib/orderDisplay'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'

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
    <Card className="flex flex-col gap-2 p-5">
      <h2 className="text-muted-foreground text-sm font-medium">{title}</h2>
      <p className="text-foreground text-3xl font-bold tabular-nums">
        <bdi dir="ltr">{value}</bdi>
      </p>
      <p className="text-muted-foreground text-sm">{body}</p>
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
    <div className="grid gap-4 md:grid-cols-3">
      <KpiCard
        title={t('confirmed.title')}
        value={formatCount(kpis.confirmed.count, locale)}
        body={
          topValue
            ? t.rich('confirmed.value', {
                amount: () => (
                  <bdi dir="ltr" className="text-foreground font-semibold">
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
    </div>
  )
}
