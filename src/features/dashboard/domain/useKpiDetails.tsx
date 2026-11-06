'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatCount, formatOrderAmount } from '../lib/orderDisplay'
import type { DashboardOverview } from '../model/dashboard.model'

/** Amounts are written left to right whatever the page direction. */
function Amount({ children }: { children: string }) {
  return <bdi dir="ltr">{children}</bdi>
}

export interface KpiDetails {
  confirmed: ReactNode
  canceled: ReactNode
  rate: ReactNode
}

/**
 * One merchant rarely sells in two currencies; when they do, the largest
 * total leads and the rest follow rather than being summed across rates.
 */
function joinValues(
  values: ReadonlyArray<{ currency: string; amount: string }> | undefined,
  locale: string
) {
  return (values ?? [])
    .map((value) => formatOrderAmount(value.amount, value.currency, locale))
    .join(' + ')
}

/**
 * The line under a dashboard number: what the confirmed and the canceled
 * orders are worth, and what the rate is a share of. Each is null when the period has nothing to
 * say, so the card stays quiet.
 */
export function useKpiDetails(kpis: DashboardOverview['kpis']): KpiDetails {
  const t = useTranslations('dashboard.overview.kpis')
  const { locale } = useLocaleInfo()

  const confirmedValue = joinValues(kpis.confirmed.value, locale)
  const canceledValue = joinValues(kpis.canceled_before_shipping.value, locale)

  return {
    confirmed:
      kpis.confirmed.count > 0 && confirmedValue
        ? t.rich('confirmed.value', {
            amount: () => <Amount>{confirmedValue}</Amount>,
          })
        : null,
    canceled:
      kpis.canceled_before_shipping.count > 0 && canceledValue
        ? t.rich('canceled.value', {
            amount: () => <Amount>{canceledValue}</Amount>,
          })
        : null,
    rate:
      kpis.confirmation_rate.sent > 0
        ? t('rate.body', {
            confirmed: formatCount(kpis.confirmation_rate.confirmed, locale),
            sent: formatCount(kpis.confirmation_rate.sent, locale),
          })
        : null,
  }
}
