'use client'

import { useState } from 'react'
import {
  LoadingSpinner,
  EmptyState,
  InternationalPhoneInput,
  isValidPhoneNumber,
  type E164Value,
} from '@/shared/ui'
import { useTranslations } from 'next-intl'
import { VerificationsTableStandalone } from './VerificationsTableStandalone'
import type { DashboardSkinProps } from '../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function resolveRateColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (rate >= 55) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function resolveUsageColor(percent: number): string {
  if (percent >= 95) return 'bg-red-500'
  if (percent >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function DashboardStandaloneSkin({
  stats,
  isStatsLoading,
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  verifications,
  isVerificationsLoading,
  hasMoreVerifications,
  isLoadingMoreVerifications,
  onLoadMoreVerifications,
  hasVerifications,
  emptyVerificationsMessage,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
  isSendingTest,
  testFeedback,
  onSendTestVerification,
  onDismissTestFeedback,
  error,
}: DashboardSkinProps) {
  const t = useTranslations('dashboard')
  const [testPhone, setTestPhone] = useState<E164Value | undefined>()
  const isPhoneValid = testPhone ? isValidPhoneNumber(testPhone) : false

  const handleSendTest = () => {
    if (!testPhone || !isPhoneValid) return
    onSendTestVerification(testPhone)
  }

  const usagePercent = stats
    ? Math.min(
        100,
        Math.round((stats.usage.used / Math.max(stats.usage.limit, 1)) * 100)
      )
    : 0

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-500">
          <span className="sr-only">{t('filters.dateRange.label')}</span>
          <select
            value={dateRangeFilter}
            onChange={(event) =>
              onDateRangeFilterChange(
                event.target.value as DashboardStatsDateRange
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* ── Banners ─────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {testFeedback && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
            testFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : testFeedback.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span>{testFeedback.message}</span>
          <button
            type="button"
            onClick={onDismissTestFeedback}
            className="ms-3 font-semibold opacity-60 transition hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Hero KPIs — what matters now ────────────────────────────── */}
      {isStatsLoading && !stats ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <LoadingSpinner message={t('metrics.loading')} />
        </section>
      ) : stats ? (
        <div className="space-y-6">
          {/* Primary KPI band */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Confirmed */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
              <p className="text-xs font-medium tracking-wide text-emerald-600 uppercase">
                {t('metrics.cards.confirmed')}
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                {stats.totals.confirmed}
              </p>
            </div>

            {/* Canceled */}
            <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
              <p className="text-xs font-medium tracking-wide text-red-600 uppercase">
                {t('metrics.cards.canceled')}
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                {stats.totals.canceled}
              </p>
            </div>

            {/* Reply Rate */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                {t('metrics.replyRate', { value: '' }).replace(/%?\s*$/, '')}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-4xl font-bold tracking-tight text-slate-900">
                  {stats.totals.reply_rate}%
                </p>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${resolveRateColor(stats.totals.reply_rate)}`}
                >
                  {stats.totals.reply_rate >= 80
                    ? '●'
                    : stats.totals.reply_rate >= 55
                      ? '●'
                      : '●'}
                </span>
              </div>
            </div>

            {/* Usage */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                {t('metrics.usage.title')}
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                {stats.usage.used}
                <span className="text-lg font-normal text-slate-400">
                  {' '}
                  / {stats.usage.limit}
                </span>
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${resolveUsageColor(usagePercent)}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Usage warning */}
          {usagePercent >= 80 && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                usagePercent >= 95
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {usagePercent >= 95
                ? t('metrics.usage.warningAtLimit')
                : t('metrics.usage.warningNearLimit')}
            </div>
          )}

          {/* Secondary metrics + Insights */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Delivery funnel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">
                {t('metrics.summaryTitle')}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: 'sent',
                    label: t('metrics.cards.sent'),
                    value: stats.totals.sent,
                  },
                  {
                    id: 'delivered',
                    label: t('metrics.cards.delivered'),
                    value: stats.totals.delivered,
                  },
                  {
                    id: 'read',
                    label: t('metrics.cards.read'),
                    value: stats.totals.read,
                  },
                ].map((metric) => (
                  <div
                    key={metric.id}
                    className="rounded-xl bg-slate-50 p-3 text-center"
                  >
                    <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Money saved */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
              <h3 className="mb-1 text-sm font-semibold text-slate-700">
                {t('metrics.moneySaved.title')}
              </h3>
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {formatMoney(stats.savings.money_saved, stats.savings.currency)}
              </p>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-[11px] text-slate-400">
                  {t('metrics.moneySaved.breakdownTitle')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t('metrics.moneySaved.breakdownLine', {
                    count: stats.totals.canceled,
                    cost: stats.savings.avg_shipping_cost,
                    currency: stats.savings.currency,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <EmptyState message={t('metrics.unavailable')} />
        </section>
      )}

      {/* ── Verifications section ───────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Section header */}
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold text-slate-900">
                {t('verificationSection.title')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('verificationSection.subtitle')}
              </p>
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {statusFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => onStatusFilterChange(filter.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === filter.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table body */}
        <div className="px-6 py-5">
          {isVerificationsLoading ? (
            <div className="py-8">
              <LoadingSpinner message={t('verificationSection.loading')} />
            </div>
          ) : hasVerifications ? (
            <div className="space-y-4">
              <VerificationsTableStandalone verifications={verifications} />
              {hasMoreVerifications && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={onLoadMoreVerifications}
                    disabled={isLoadingMoreVerifications}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingMoreVerifications
                      ? t('table.loadingMore')
                      : t('table.loadMore')}
                  </button>
                </div>
              )}
            </div>
          ) : statusFilter === 'all' ? (
            <div className="rounded-xl bg-slate-50 p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {t('emptyState.onboarding.heading')}
                  </h3>
                  <p className="max-w-lg text-sm text-slate-500">
                    {t('emptyState.onboarding.activeDescription')}
                  </p>
                </div>

                {/* Steps */}
                <ol className="space-y-3">
                  {(['step1', 'step2', 'step3'] as const).map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-sm text-slate-600">
                        {t(`emptyState.onboarding.${step}`)}
                      </span>
                    </li>
                  ))}
                </ol>

                {/* Test verification */}
                <div className="space-y-3 border-t border-slate-200 pt-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-800">
                      {t('emptyState.onboarding.testSectionHeading')}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t('emptyState.onboarding.nextStepHint')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end gap-3">
                    <div className="max-w-sm min-w-[16rem] flex-1">
                      <InternationalPhoneInput
                        value={testPhone}
                        onChange={setTestPhone}
                        label={t('emptyState.onboarding.testPhoneLabel')}
                        placeholder={t(
                          'emptyState.onboarding.testPhonePlaceholder'
                        )}
                        defaultCountry="EG"
                        disabled={isSendingTest}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!isPhoneValid || isSendingTest}
                      onClick={handleSendTest}
                      className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSendingTest
                        ? t('emptyState.onboarding.testSendingLabel')
                        : t('emptyState.onboarding.testSendLabel')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message={emptyVerificationsMessage} />
          )}
        </div>
      </section>
    </div>
  )
}
