'use client'

import Link from 'next/link'
import { Activity, CheckCheck, Package, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { akCard } from '@/shared/ui'
import {
  formatCount,
  formatPercent,
} from '@/features/dashboard/lib/orderDisplay'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'

/**
 * One number and one short detail under a small label. With `href` the whole
 * card opens the matching confirmations list.
 */
function KpiCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: string
  href?: string
}) {
  const body = (
    <>
      <h2 className="text-ak-body text-ink-muted flex items-center gap-2">
        <Icon aria-hidden="true" className="text-brand size-4.5 shrink-0" />
        <span className="truncate">{label}</span>
      </h2>
      <div className="mt-3 flex min-w-0 items-end gap-4">
        <p className="text-ak-kpi text-ink shrink-0 tabular-nums">
          <bdi>{value}</bdi>
        </p>
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

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KpiCard
        icon={CheckCheck}
        label={t('confirmed')}
        value={formatCount(kpis.confirmed.count, locale)}
        href={confirmedHref}
      />
      <KpiCard
        icon={Package}
        label={t('canceled')}
        value={formatCount(kpis.canceled_before_shipping.count, locale)}
        href={canceledHref}
      />
      <KpiCard
        icon={Activity}
        label={t('rate')}
        value={formatPercent(kpis.confirmation_rate.rate, locale)}
      />
    </div>
  )
}
