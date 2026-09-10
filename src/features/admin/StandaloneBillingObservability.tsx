'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button, Input } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { AdminMetricCard, AdminSelect } from './AdminUi'
import { formatDateTime, formatNumber } from './standaloneBillingFormat'
import { useBillingObservability } from './useBillingObservability'
import type {
  BillingFindingFilters,
  BillingHealthStatus,
} from './billing-observability.model'

const rangeOptions = ['7', '30', '90', 'all'] as const
const healthTone: Record<BillingHealthStatus, string> = {
  healthy: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  attention: 'border-amber-200 bg-amber-50 text-amber-950',
  critical: 'border-red-200 bg-red-50 text-red-950',
}

export function StandaloneBillingObservability({
  canOperate,
}: {
  canOperate: boolean
}) {
  const t = useTranslations('adminBillingObservability')
  const { locale } = useLocaleInfo()
  const state = useBillingObservability()
  const [reason, setReason] = useState('')
  const health = state.health
  const status = health?.health.status ?? 'healthy'
  const StatusIcon =
    status === 'critical'
      ? ShieldAlert
      : status === 'attention'
        ? AlertTriangle
        : CheckCircle2
  const money = (value: number | null) =>
    value === null
      ? t('unavailable')
      : new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'EGP',
        }).format(value / 100)

  return (
    <section className="space-y-4" aria-labelledby="billing-health-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="billing-health-title" className="text-xl font-semibold">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t('description')}</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label={t('rangeLabel')}>
          {rangeOptions.map((range) => (
            <Button
              key={range}
              size="sm"
              variant={state.range === range ? 'default' : 'outline'}
              onClick={() => state.setRange(range)}
              disabled={state.loading}
            >
              {t(`ranges.${range}`)}
            </Button>
          ))}
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-900"
        >
          {state.error.status === 403 ? t('operatorRequired') : t('loadError')}
          {state.error.requestId && (
            <span className="ms-2 font-mono" dir="ltr">
              {state.error.requestId}
            </span>
          )}
          <Button
            className="ms-3"
            size="sm"
            variant="outline"
            onClick={state.refresh}
            disabled={state.loading}
          >
            {t('retry')}
          </Button>
        </p>
      )}
      {state.loading && !health ? (
        <p
          role="status"
          className="rounded-xl bg-slate-50 p-6 text-center text-sm"
        >
          {t('loading')}
        </p>
      ) : health ? (
        <>
          <div className={cn('rounded-xl border p-4', healthTone[status])}>
            <div className="flex items-start gap-3">
              <StatusIcon
                className="mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-semibold">{t(`status.${status}`)}</p>
                <p className="mt-1 text-sm">
                  {t('healthSummary', {
                    open: health.health.openFindings,
                    oldest: health.health.oldestFindingAgeMinutes,
                    attempts: health.health.provider.attempts,
                    errors: health.health.provider.errorRatePercent,
                  })}
                </p>
                <p className="mt-1 text-xs">
                  {t('mode', {
                    inquiry: health.health.scheduledInquiryEnabled
                      ? t('enabled')
                      : t('disabled'),
                    mode: health.health.reportOnly
                      ? t('reportOnly')
                      : t('active'),
                  })}
                </p>
                <p className="mt-1 text-xs">
                  {health.health.latestRun
                    ? t('lastRun', {
                        time: formatDateTime(
                          health.health.latestRun.completedAt ??
                            health.health.latestRun.createdAt,
                          locale
                        ),
                        status: t(
                          `runStatus.${health.health.latestRun.status}`
                        ),
                      })
                    : t('noRuns')}{' '}
                  ·{' '}
                  <span dir="ltr">
                    {health.health.cron} ({health.health.timezone})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {!health.settlementCoverage.complete && (
            <p
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
            >
              {t('coverageWarning')}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard
              label={t('metrics.approved')}
              value={formatNumber(health.product.approvedOrganizations, locale)}
              detail={t('metrics.balanceDetail', {
                low: health.product.lowBalanceOrganizations,
                zero: health.product.zeroBalanceOrganizations,
              })}
            />
            <AdminMetricCard
              label={t('metrics.conversion')}
              value={`${formatNumber(health.product.paidConversionPercent, locale)}%`}
              detail={t('metrics.purchaseDetail', {
                first: health.product.firstPurchases,
                repeat: health.product.repeatPurchases,
              })}
            />
            <AdminMetricCard
              label={t('metrics.netRevenue')}
              value={money(health.finance.netRevenueMinor)}
              detail={t('metrics.gross', {
                amount: money(health.finance.grossMinor),
              })}
            />
            <AdminMetricCard
              label={t('metrics.liability')}
              value={money(health.finance.unspentPaidCreditLiabilityMinor)}
              detail={t('metrics.liabilityCredits', {
                count: health.finance.unspentPaidCredits,
              })}
            />
            <AdminMetricCard
              label={t('metrics.arppu')}
              value={money(health.finance.arppuMinor)}
            />
            <AdminMetricCard
              label={t('metrics.revenuePerMessage')}
              value={money(health.finance.revenuePerAcceptedMessageMinor)}
            />
            <AdminMetricCard
              label={t('metrics.freeUtilization')}
              value={`${formatNumber(health.product.freeUtilizationPercent, locale)}%`}
              detail={t('metrics.consumption', {
                initial: health.product.initialConsumption,
                followup: health.product.followUpConsumption,
                reversed: health.product.failureReversals,
              })}
            />
            <AdminMetricCard
              label={t('metrics.provider')}
              value={`${formatNumber(health.health.provider.averageDurationMs, locale)} ms`}
              detail={t('metrics.providerDetail', {
                slow: health.health.provider.slow,
                failed: health.health.provider.failures,
              })}
              tone={health.health.provider.degraded ? 'red' : 'neutral'}
            />
          </div>
        </>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <AdminSelect
            label={t('filters.status')}
            value={state.filters.status}
            onChange={(event) =>
              state.setFilters((current) => ({
                ...current,
                status: event.target.value as BillingFindingFilters['status'],
              }))
            }
            options={['', 'open', 'resolved'].map((value) => ({
              value,
              label: t(`filters.statuses.${value || 'all'}`),
            }))}
          />
          <AdminSelect
            label={t('filters.severity')}
            value={state.filters.severity}
            onChange={(event) =>
              state.setFilters((current) => ({
                ...current,
                severity: event.target
                  .value as BillingFindingFilters['severity'],
              }))
            }
            options={['', 'attention', 'critical'].map((value) => ({
              value,
              label: t(`filters.severities.${value || 'all'}`),
            }))}
          />
          <label className="min-w-48 flex-1 text-xs font-medium text-slate-600">
            {t('filters.code')}
            <Input
              className="mt-1.5"
              value={state.filters.code}
              onChange={(event) =>
                state.setFilters((current) => ({
                  ...current,
                  code: event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, ''),
                }))
              }
            />
          </label>
          <div className="flex min-w-0 flex-1 basis-64 gap-2">
            <Input
              value={reason}
              maxLength={500}
              placeholder={t('runReason')}
              aria-label={t('runReason')}
              disabled={!canOperate}
              onChange={(event) => setReason(event.target.value)}
            />
            <Button
              disabled={!canOperate || state.busy || !reason.trim()}
              onClick={() => state.run(reason.trim())}
            >
              {state.busy ? t('running') : t('run')}
            </Button>
          </div>
          {!canOperate && (
            <p className="w-full text-xs text-slate-600">{t('runReadOnly')}</p>
          )}
        </div>
        <div className="max-h-96 overflow-auto overscroll-contain">
          {state.findings?.rows.length ? (
            <table className="w-full min-w-3xl text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="p-3 text-start">{t('queue.severity')}</th>
                  <th className="p-3 text-start">{t('queue.code')}</th>
                  <th className="p-3 text-start">{t('queue.account')}</th>
                  <th className="p-3 text-start">{t('queue.action')}</th>
                  <th className="p-3 text-start">{t('queue.seen')}</th>
                </tr>
              </thead>
              <tbody>
                {state.findings.rows.map((finding) => (
                  <tr
                    key={finding.id}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="p-3">{t(`severity.${finding.severity}`)}</td>
                    <td className="p-3 font-mono text-xs" dir="ltr">
                      {finding.code}
                    </td>
                    <td className="p-3">
                      {finding.orgId ? (
                        <Link
                          className="font-mono text-xs text-emerald-700 hover:underline"
                          dir="ltr"
                          href={`/${locale}/admin/standalone-billing/${finding.orgId}`}
                        >
                          {finding.orgId}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3">
                      {t(`actions.${finding.nextAction}`)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {formatDateTime(finding.lastSeenAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">
              {state.loading ? t('loadingQueue') : t('emptyQueue')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
