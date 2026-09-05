'use client'

import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneVerificationsSection } from './components/StandaloneVerificationsSection'
import type { StandaloneDashboardSkinProps } from '../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'

export function DashboardVerificationsStandaloneSkin(
  props: StandaloneDashboardSkinProps
) {
  const t = useTranslations('dashboard')

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('orders.title')}
          </h1>
          <p className="text-sm text-slate-500">{t('orders.pageSubtitle')}</p>
        </div>
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
      </header>

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
        orders={props.orders}
        reportingTimezone={props.reportingTimezone}
        totalOrderCount={props.totalOrderCount}
        isOrdersLoading={props.isOrdersLoading}
        hasMoreOrders={props.hasMoreOrders}
        isLoadingMoreOrders={props.isLoadingMoreOrders}
        orderFilter={props.orderFilter}
        orderFilters={props.orderFilters}
        actingOrderId={props.actingOrderId}
        confirmingCancelOrderId={props.confirmingCancelOrderId}
        actionErrors={props.actionErrors}
        canSendTestVerification={props.canSendTestVerification}
        canCancelOrders={props.canCancelOrders}
        canRetryVerifications={props.canRetryVerifications}
        isSendingTest={props.isSendingTest}
        onOrderFilterChange={props.onOrderFilterChange}
        onLoadMoreOrders={props.onLoadMoreOrders}
        onRequestCancelOrder={props.onRequestCancelOrder}
        onDismissCancelOrder={props.onDismissCancelOrder}
        onConfirmCancelOrder={props.onConfirmCancelOrder}
        onRetryVerification={props.onRetryVerification}
        onSendTestVerification={props.onSendTestVerification}
      />
    </div>
  )
}
