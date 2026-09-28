'use client'

import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import {
  formatCount,
  formatPercent,
} from '@/features/dashboard/lib/orderDisplay'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'
import { StatusBadge } from '../shared/StatusBadge'
import { akCard } from '../shared/akStyles'

type Funnel = DashboardOverview['funnel']

function share(part: number, whole: number) {
  return whole > 0
    ? `${Math.min((Math.max(part, 0) / whole) * 100, 100)}%`
    : '0%'
}

/**
 * One step of the flow. The track clips its segments (`overflow-hidden`), so
 * only the track has a radius and the segments stay square — the rounded
 * ends then land on the right side in both LTR and RTL.
 */
function FlowRow({
  label,
  count,
  percent,
  sent,
  segments,
}: {
  label: string
  count: number
  /** Omitted on the first row, which is the 100% everything else is of. */
  percent?: number | null
  sent: number
  segments: Array<{ value: number; className: string }>
}) {
  const { locale } = useLocaleInfo()

  return (
    <li className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[140px_minmax(0,1fr)_7.5rem] sm:gap-4">
      <span className="text-ak-body text-ink truncate">{label}</span>
      <div
        aria-hidden="true"
        className="bg-neutral-soft flex h-3 w-full overflow-hidden rounded-[6px]"
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className={cn(
              'motion-safe:animate-ak-grow h-full shrink-0',
              index > 0 && 'border-surface-raised border-s-2',
              segment.className
            )}
            style={{ width: share(segment.value, sent) }}
          />
        ))}
      </div>
      <span className="text-ak-body text-end whitespace-nowrap tabular-nums">
        <bdi dir="ltr">
          {percent !== undefined && (
            <span className="text-ink-muted">
              {formatPercent(percent, locale)} ·{' '}
            </span>
          )}
          <span className="text-ink font-semibold">
            {formatCount(count, locale)}
          </span>
        </bdi>
      </span>
    </li>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-end">
      <dt className="text-ak-caption text-ink-muted whitespace-nowrap">
        {label}
      </dt>
      <dd className="text-ak-section text-ink tabular-nums">
        <bdi dir="ltr">{value}</bdi>
      </dd>
    </div>
  )
}

/**
 * Sent → delivered → read → replied, each bar scaled to what was sent. The
 * last bar splits into confirmed and canceled (hatched, so it isn't told
 * apart by colour alone); what's left of the track is "no reply yet".
 */
export function MessageFlowCard({
  funnel,
  manualConfirmed,
}: {
  funnel: Funnel
  /** Confirmed by the merchant after a send; outside the reply bar. */
  manualConfirmed: number
}) {
  const t = useTranslations('dashboard.overview.flow')
  const tFlow = useTranslations('dashboard.standalone.flow')
  const { locale } = useLocaleInfo()
  const sent = funnel.sent.count

  return (
    <section
      aria-labelledby="message-flow-title"
      className={cn(akCard, 'px-6 py-5')}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 space-y-1">
          <h2 id="message-flow-title" className="text-ak-section text-ink">
            {t('title')}
          </h2>
          <p className="text-ak-body text-ink-muted">{t('subtitle')}</p>
        </div>
        {sent > 0 && (
          <dl className="flex">
            <div className="pe-6">
              <MiniStat
                label={tFlow('deliveryRate')}
                value={formatPercent(funnel.delivered.percent_of_sent, locale)}
              />
            </div>
            <div className="border-line border-s ps-6">
              <MiniStat
                label={tFlow('replyRate')}
                value={formatPercent(funnel.replied.percent_of_sent, locale)}
              />
            </div>
          </dl>
        )}
      </div>

      {sent === 0 ? (
        <p className="text-ak-body text-ink-muted mt-4">{t('empty')}</p>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-4">
            <FlowRow
              label={t('sent')}
              count={sent}
              sent={sent}
              segments={[{ value: sent, className: 'bg-brand' }]}
            />
            <FlowRow
              label={t('delivered')}
              count={funnel.delivered.count}
              percent={funnel.delivered.percent_of_sent}
              sent={sent}
              segments={[
                { value: funnel.delivered.count, className: 'bg-brand' },
              ]}
            />
            <FlowRow
              label={t('read')}
              count={funnel.read.count}
              percent={funnel.read.percent_of_sent}
              sent={sent}
              segments={[{ value: funnel.read.count, className: 'bg-brand' }]}
            />
            <FlowRow
              label={tFlow('replied')}
              count={funnel.replied.count}
              percent={funnel.replied.percent_of_sent}
              sent={sent}
              segments={[
                { value: funnel.confirmed, className: 'bg-brand' },
                { value: funnel.customer_canceled, className: 'ak-stripe' },
              ]}
            />
          </ul>
          <div className="border-line mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 sm:ms-[calc(140px+1rem)]">
            <ul
              aria-label={tFlow('legendLabel')}
              className="flex flex-wrap gap-2"
            >
              <li>
                <StatusBadge kind="confirmed" size="md">
                  {tFlow('confirmed')}{' '}
                  <bdi className="font-bold tabular-nums">
                    {formatCount(funnel.confirmed, locale)}
                  </bdi>
                </StatusBadge>
              </li>
              <li>
                <StatusBadge kind="canceled" size="md">
                  {tFlow('canceled')}{' '}
                  <bdi className="font-bold tabular-nums">
                    {formatCount(funnel.customer_canceled, locale)}
                  </bdi>
                </StatusBadge>
              </li>
              <li>
                <StatusBadge kind="scheduled" icon={Clock} size="md">
                  {tFlow('noReply')}{' '}
                  <bdi className="font-bold tabular-nums">
                    {formatCount(funnel.no_reply_yet, locale)}
                  </bdi>
                </StatusBadge>
              </li>
            </ul>
            {manualConfirmed > 0 && (
              <p className="text-ak-body text-ink-muted">
                {tFlow('moreManual', { count: manualConfirmed })}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
