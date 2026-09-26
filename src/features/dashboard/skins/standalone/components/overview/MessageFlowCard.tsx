'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui'
import {
  formatCount,
  formatPercent,
} from '@/features/dashboard/lib/orderDisplay'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'

type Funnel = DashboardOverview['funnel']

const CONFIRMED = 'bg-success'
const CANCELED = 'bg-destructive'
const NO_REPLY = 'bg-muted-foreground/40'

function share(part: number, whole: number) {
  return whole > 0 ? `${Math.min((part / whole) * 100, 100)}%` : '0%'
}

function FlowRow({
  label,
  count,
  percent,
  sent,
  segments,
  showPercent,
}: {
  label: string
  count: number
  percent: number | null
  sent: number
  segments: Array<{ value: number; className: string }>
  showPercent: boolean
}) {
  const { locale } = useLocaleInfo()

  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_5.5rem] sm:gap-4">
      <span className="text-foreground text-xs sm:text-sm">{label}</span>
      <div
        aria-hidden="true"
        className="bg-muted flex h-6 w-full gap-0.5 overflow-hidden rounded-md"
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className={cn(
              'h-full first:rounded-s-md last:rounded-e-md',
              segment.className
            )}
            style={{ width: share(segment.value, sent) }}
          />
        ))}
      </div>
      <span className="text-end text-sm">
        <bdi dir="ltr">
          {showPercent && (
            <span className="text-muted-foreground">
              {formatPercent(percent, locale)} ·{' '}
            </span>
          )}
          <span className="text-foreground font-semibold tabular-nums">
            {formatCount(count, locale)}
          </span>
        </bdi>
      </span>
    </li>
  )
}

function LegendItem({
  className,
  label,
}: {
  className: string
  label: string
}) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={cn('inline-block size-2.5 rounded-sm', className)}
      />
      <span className="text-muted-foreground text-xs">{label}</span>
    </li>
  )
}

/**
 * Sent → delivered → read → replied, each bar scaled to what was sent. The
 * last bar splits into confirmed and canceled so the outcome is visible at a
 * glance.
 */
export function MessageFlowCard({ funnel }: { funnel: Funnel }) {
  const t = useTranslations('dashboard.overview.flow')
  const { locale } = useLocaleInfo()
  const sent = funnel.sent.count

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="space-y-1">
        <h2 className="text-h3 text-foreground">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>
      {sent === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            <FlowRow
              label={t('sent')}
              count={sent}
              percent={funnel.sent.percent_of_sent}
              sent={sent}
              segments={[{ value: sent, className: CONFIRMED }]}
              showPercent={false}
            />
            <FlowRow
              label={t('delivered')}
              count={funnel.delivered.count}
              percent={funnel.delivered.percent_of_sent}
              sent={sent}
              segments={[
                { value: funnel.delivered.count, className: CONFIRMED },
              ]}
              showPercent
            />
            <FlowRow
              label={t('read')}
              count={funnel.read.count}
              percent={funnel.read.percent_of_sent}
              sent={sent}
              segments={[{ value: funnel.read.count, className: CONFIRMED }]}
              showPercent
            />
            <FlowRow
              label={t('replied')}
              count={funnel.replied.count}
              percent={funnel.replied.percent_of_sent}
              sent={sent}
              segments={[
                { value: funnel.confirmed, className: CONFIRMED },
                { value: funnel.customer_canceled, className: CANCELED },
              ]}
              showPercent
            />
          </ul>
          <ul className="border-border flex flex-wrap gap-x-6 gap-y-2 border-t pt-4">
            <LegendItem
              className={CONFIRMED}
              label={t('legendConfirmed', {
                count: formatCount(funnel.confirmed, locale),
              })}
            />
            <LegendItem
              className={CANCELED}
              label={t('legendCanceled', {
                count: formatCount(funnel.customer_canceled, locale),
              })}
            />
            <LegendItem
              className={NO_REPLY}
              label={t('legendNoReply', {
                count: formatCount(funnel.no_reply_yet, locale),
              })}
            />
          </ul>
        </>
      )}
    </Card>
  )
}
