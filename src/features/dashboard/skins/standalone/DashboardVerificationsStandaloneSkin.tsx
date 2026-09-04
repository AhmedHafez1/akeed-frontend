'use client'

import { useTranslations } from 'next-intl'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneVerificationsSection } from './components/StandaloneVerificationsSection'
import type { DashboardSkinProps } from '../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'

export function DashboardVerificationsStandaloneSkin({
  dateRangeFilter,
  dateRangeOptions,
  onDateRangeFilterChange,
  sourceStatus,
  verifications,
  isVerificationsLoading,
  hasMoreVerifications,
  isLoadingMoreVerifications,
  onLoadMoreVerifications,
  hasVerifications,
  emptyVerificationsMessage,
  cancelingVerificationId,
  confirmingCancelVerificationId,
  cancelOrderErrors,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
  isSendingTest,
  canSendTestVerification,
  canCancelOrders,
  testFeedback,
  onSendTestVerification,
  onDismissTestFeedback,
  error,
}: DashboardSkinProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('verificationSection.title')}
          </h1>
          <p className="text-sm text-slate-500">
            {t('verificationSection.subtitle')}
          </p>
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

      <StandaloneFeedbackBanners
        error={error}
        testFeedback={testFeedback}
        onDismissTestFeedback={onDismissTestFeedback}
      />

      {sourceStatus === 'disconnected' && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
        >
          <p className="font-semibold">{t('sourceDisconnectedTitle')}</p>
          <p className="mt-1 text-sm">{t('sourceDisconnectedDescription')}</p>
        </div>
      )}

      <StandaloneVerificationsSection
        verifications={verifications}
        isVerificationsLoading={isVerificationsLoading}
        hasMoreVerifications={hasMoreVerifications}
        isLoadingMoreVerifications={isLoadingMoreVerifications}
        hasVerifications={hasVerifications}
        emptyVerificationsMessage={emptyVerificationsMessage}
        cancelingVerificationId={cancelingVerificationId}
        confirmingCancelVerificationId={confirmingCancelVerificationId}
        cancelOrderErrors={cancelOrderErrors}
        statusFilter={statusFilter}
        statusFilters={statusFilters}
        isSendingTest={isSendingTest}
        canSendTestVerification={canSendTestVerification}
        canCancelOrders={canCancelOrders}
        onRequestCancelOrder={onRequestCancelOrder}
        onDismissCancelOrder={onDismissCancelOrder}
        onConfirmCancelOrder={onConfirmCancelOrder}
        onStatusFilterChange={onStatusFilterChange}
        onLoadMoreVerifications={onLoadMoreVerifications}
        onSendTestVerification={onSendTestVerification}
      />
    </div>
  )
}
