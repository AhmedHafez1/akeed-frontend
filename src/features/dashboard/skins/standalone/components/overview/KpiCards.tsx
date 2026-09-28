'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Activity, CircleCheck, Package, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import {
  formatCount,
  formatOrderAmount,
  formatPercent,
} from '@/features/dashboard/lib/orderDisplay'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'
import { akCard } from '../shared/akStyles'

/**
 * One number and one short detail under a small label. With `href` the whole
 * card opens the matching confirmations list.
 */
function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  href,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail: ReactNode
  href?: string
}) {
  const body = (
    <>
      <h2 className="text-ak-body text-ink-muted flex items-center gap-2">
        <Icon aria-hidden="true" className="text-brand size-[18px] shrink-0" />
        <span className="truncate">{label}</span>
      </h2>
      <div className="mt-3 flex min-w-0 items-end gap-4">
        <p className="text-ak-kpi text-ink shrink-0 tabular-nums">
          <bdi>{value}</bdi>
        </p>
        <div className="text-ak-body flex min-w-0 flex-1 items-center justify-end gap-3 pb-1">
          {detail}
        </div>
      </div>
    </>
  )
  const frame = cn(akCard, 'block px-6 py-5')

  return href ? (
    <Link
      href={href}
      className={cn(
        frame,
        'ak-focus hover:border-line-strong transition-colors'
      )}
    >
      {body}
    </Link>
  ) : (
    <section className={frame}>{body}</section>
  )
}

/** The three numbers a merchant cares about, in equal columns. */
export function KpiCards({
  kpis,
  confirmedHref,
  canceledHref,
}: {
  kpis: DashboardOverview['kpis']
  confirmedHref?: string
  canceledHref?: string
}) {
  const t = useTranslations('dashboard.standalone.kpis')
  const { locale } = useLocaleInfo()
  const [topValue] = kpis.confirmed.value
  const rate = kpis.confirmation_rate
  const amount = topValue
    ? formatOrderAmount(topValue.amount, topValue.currency, locale, {
        currencyAfter: true,
      })
    : null
  const ratePercent = rate.rate === null ? 0 : Math.min(rate.rate, 100)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KpiCard
        icon={CircleCheck}
        label={t('confirmed')}
        value={formatCount(kpis.confirmed.count, locale)}
        href={confirmedHref}
        detail={
          amount && (
            <p className="text-brand-ink truncate font-semibold tabular-nums">
              <bdi dir="ltr">{amount}</bdi>
            </p>
          )
        }
      />
      <KpiCard
        icon={Package}
        label={t('canceled')}
        value={formatCount(kpis.canceled_before_shipping.count, locale)}
        href={canceledHref}
        detail={
          kpis.canceled_before_shipping.count > 0 && (
            <p className="text-ink-muted truncate">{t('canceledDetail')}</p>
          )
        }
      />
      <KpiCard
        icon={Activity}
        label={t('rate')}
        value={formatPercent(rate.rate, locale)}
        detail={
          rate.sent > 0 && (
            <>
              <div
                role="progressbar"
                aria-label={t('rate')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(ratePercent)}
                className="bg-neutral-soft h-1.5 min-w-10 flex-1 overflow-hidden rounded-full"
              >
                <div
                  className="bg-brand h-full"
                  style={{ width: `${ratePercent}%` }}
                />
              </div>
              <p className="text-ink-muted shrink-0 tabular-nums">
                <span aria-hidden="true">
                  {t('rateDetail', {
                    confirmed: formatCount(rate.confirmed, locale),
                    sent: formatCount(rate.sent, locale),
                  })}
                </span>
                <span className="sr-only">
                  {t('rateDetailLabel', {
                    confirmed: formatCount(rate.confirmed, locale),
                    sent: formatCount(rate.sent, locale),
                  })}
                </span>
              </p>
            </>
          )
        }
      />
    </div>
  )
}
