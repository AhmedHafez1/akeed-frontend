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
 * say, so the card stays quiet. `compact` (standalone) keeps only the
 * figures: the amount, and the rate as confirmed/sent.
 */
export function useKpiDetails(
  kpis: DashboardOverview['kpis'],
  { compact = false }: { compact?: boolean } = {}
): KpiDetails {
  const t = useTranslations('dashboard.overview.kpis')
  const tCompact = useTranslations('dashboard.standalone.kpis')
  const { locale } = useLocaleInfo()

  const confirmedValue = joinValues(kpis.confirmed.value, locale)
  const compactRate = () => {
    const counts = {
      confirmed: formatCount(kpis.confirmation_rate.confirmed, locale),
      sent: formatCount(kpis.confirmation_rate.sent, locale),
    }
    return (
      <>
        <bdi aria-hidden="true">{tCompact('rateDetail', counts)}</bdi>
        <span className="sr-only">{tCompact('rateDetailLabel', counts)}</span>
      </>
    )
  }
  const canceledValue = joinValues(kpis.canceled_before_shipping.value, locale)

  return {
    confirmed:
      kpis.confirmed.count > 0 && confirmedValue ? (
        compact ? (
          <Amount>{confirmedValue}</Amount>
        ) : (
          t.rich('confirmed.value', {
            amount: () => <Amount>{confirmedValue}</Amount>,
          })
        )
      ) : null,
    canceled:
      kpis.canceled_before_shipping.count > 0 && canceledValue ? (
        compact ? (
          <Amount>{canceledValue}</Amount>
        ) : (
          t.rich('canceled.value', {
            amount: () => <Amount>{canceledValue}</Amount>,
          })
        )
      ) : null,
    rate:
      kpis.confirmation_rate.sent > 0
        ? compact
          ? compactRate()
          : t('rate.body', {
              confirmed: formatCount(kpis.confirmation_rate.confirmed, locale),
              sent: formatCount(kpis.confirmation_rate.sent, locale),
            })
        : null,
  }
}
