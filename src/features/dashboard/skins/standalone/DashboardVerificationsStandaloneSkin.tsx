'use client'

import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneVerificationsSection } from './components/StandaloneVerificationsSection'
import { StandaloneVerificationWorkload } from './components/StandaloneVerificationWorkload'
import { ManualOrderEntryStandalone } from '@/features/orders'
import type { DashboardSkinProps } from '../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'

export function DashboardVerificationsStandaloneSkin(
  props: DashboardSkinProps
) {
  const t = useTranslations('dashboard')

  return (
    <div className="mx-auto w-full max-w-[1400px] min-w-0 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
            {t('verifications.eyebrow')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('verifications.title')}
          </h1>
          <p className="text-sm text-slate-500">
            {t('verifications.pageSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex items-center gap-2 text-sm text-slate-500">
            <span className="sr-only">{t('filters.dateRange.label')}</span>
            <select
              value={props.dateRangeFilter}
              onChange={(event) =>
                props.onDateRangeFilterChange(
                  event.target.value as DashboardStatsDateRange
                )
              }
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2 ps-3 pe-10 text-sm text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
            >
              {props.dateRangeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            />
          </label>
          {/* The list's own empty state tells the merchant to verify an order,
            so the action it names has to be reachable from this screen. */}
          <ManualOrderEntryStandalone
            triggerClassName="h-10 rounded-lg bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
            canCreate={props.canCreateManualOrder}
            defaultCurrency={props.stats?.savings.currency}
            sourceConnected={props.sourceStatus === 'connected'}
            onAccepted={props.onManualOrderAccepted}
          />
        </div>
      </header>

      <StandaloneVerificationWorkload
        dateRangeFilter={props.dateRangeFilter}
        stats={props.stats}
        isStatsLoading={props.isStatsLoading}
        statusFilter={props.statusFilter}
        onStatusFilterChange={props.onStatusFilterChange}
      />

      <StandaloneFeedbackBanners
        error={props.error}
        testFeedback={props.testFeedback}
        actionFeedback={props.actionFeedback}
        onDismissTestFeedback={props.onDismissTestFeedback}
        onDismissActionFeedback={props.onDismissActionFeedback}
      />

      {props.sourceStatus === 'disconnected' && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
        >
          <p className="font-semibold">{t('sourceDisconnectedTitle')}</p>
          <p className="mt-1 text-sm">{t('sourceDisconnectedDescription')}</p>
        </div>
      )}

      <StandaloneVerificationsSection
        verifications={props.verifications}
        reportingTimezone={props.reportingTimezone}
        totalCount={props.totalCount}
        isVerificationsLoading={props.isVerificationsLoading}
        hasMoreVerifications={props.hasMoreVerifications}
        isLoadingMoreVerifications={props.isLoadingMoreVerifications}
        statusFilter={props.statusFilter}
        statusFilters={props.statusFilters}
        actingVerificationId={props.actingVerificationId}
        confirmingCancelVerificationId={props.confirmingCancelVerificationId}
        actionErrors={props.actionErrors}
        canSendTestVerification={props.canSendTestVerification}
        canCancelOrders={props.canCancelOrders}
        canRetryVerifications={props.canRetryVerifications}
        isSendingTest={props.isSendingTest}
        onStatusFilterChange={props.onStatusFilterChange}
        onLoadMoreVerifications={props.onLoadMoreVerifications}
        onRequestCancelOrder={props.onRequestCancelOrder}
        onDismissCancelOrder={props.onDismissCancelOrder}
        onConfirmCancelOrder={props.onConfirmCancelOrder}
        onRetryVerification={props.onRetryVerification}
        onSendTestVerification={props.onSendTestVerification}
      />
    </div>
  )
}
