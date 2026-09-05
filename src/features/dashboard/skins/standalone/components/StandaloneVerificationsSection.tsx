'use client'

import { useTranslations } from 'next-intl'
import { EmptyState, LoadingSpinner } from '@/shared/ui'
import type {
  OrderItem,
  StandaloneOrderFilter,
} from '@/features/dashboard/model/dashboard.model'
import type { StandaloneOrderFilterOption } from '@/features/dashboard/domain/dashboard.types'
import { VerificationsTableStandalone } from '../VerificationsTableStandalone'
import { StandaloneTestVerificationPanel } from './StandaloneTestVerificationPanel'

interface StandaloneOrdersSectionProps {
  orders: OrderItem[]
  reportingTimezone: string
  totalOrderCount: number
  isOrdersLoading: boolean
  hasMoreOrders: boolean
  isLoadingMoreOrders: boolean
  orderFilter: StandaloneOrderFilter
  orderFilters: ReadonlyArray<StandaloneOrderFilterOption>
  actingOrderId: string | null
  confirmingCancelOrderId: string | null
  actionErrors: Record<string, string>
  canSendTestVerification: boolean
  canCancelOrders: boolean
  canRetryVerifications: boolean
  isSendingTest: boolean
  onOrderFilterChange: (filter: StandaloneOrderFilter) => void
  onLoadMoreOrders: () => Promise<void>
  onRequestCancelOrder: (orderId: string) => void
  onDismissCancelOrder: (orderId: string) => void
  onConfirmCancelOrder: (orderId: string) => Promise<void>
  onRetryVerification: (orderId: string) => Promise<void>
  onSendTestVerification: (customerPhone: string) => Promise<void>
}

export function StandaloneVerificationsSection({
  orders,
  reportingTimezone,
  totalOrderCount,
  isOrdersLoading,
  hasMoreOrders,
  isLoadingMoreOrders,
  orderFilter,
  orderFilters,
  actingOrderId,
  confirmingCancelOrderId,
  actionErrors,
  canSendTestVerification,
  canCancelOrders,
  canRetryVerifications,
  isSendingTest,
  onOrderFilterChange,
  onLoadMoreOrders,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  onRetryVerification,
  onSendTestVerification,
}: StandaloneOrdersSectionProps) {
  const t = useTranslations('dashboard')

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t('orders.title')}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t('orders.subtitle', { count: totalOrderCount })}
            </p>
          </div>
          <div
            role="group"
            aria-label={t('orders.filters.label')}
            className="flex flex-wrap gap-1.5"
          >
            {orderFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={orderFilter === filter.id}
                onClick={() => onOrderFilterChange(filter.id)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  orderFilter === filter.id
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        {!canSendTestVerification &&
          !canCancelOrders &&
          !canRetryVerifications && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
            >
              {t('orders.readOnlyNotice')}
            </div>
          )}
        {isOrdersLoading ? (
          <div className="py-8">
            <LoadingSpinner message={t('orders.loading')} />
          </div>
        ) : orders.length ? (
          <div className="space-y-4">
            <VerificationsTableStandalone
              orders={orders}
              reportingTimezone={reportingTimezone}
              actingOrderId={actingOrderId}
              confirmingCancelOrderId={confirmingCancelOrderId}
              actionErrors={actionErrors}
              canCancelOrders={canCancelOrders}
              canRetryVerifications={canRetryVerifications}
              onRequestCancelOrder={onRequestCancelOrder}
              onDismissCancelOrder={onDismissCancelOrder}
              onConfirmCancelOrder={onConfirmCancelOrder}
              onRetryVerification={onRetryVerification}
            />
            {hasMoreOrders && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={isLoadingMoreOrders}
                  onClick={() => void onLoadMoreOrders()}
                  className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  {isLoadingMoreOrders
                    ? t('orders.loadingMore')
                    : t('orders.loadMore')}
                </button>
              </div>
            )}
          </div>
        ) : orderFilter === 'all' ? (
          <div className="space-y-6 rounded-xl bg-slate-50 p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t('orders.empty.title')}
              </h3>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                {t('orders.empty.description')}
              </p>
            </div>
            {canSendTestVerification && (
              <StandaloneTestVerificationPanel
                heading={t('emptyState.onboarding.testSectionHeading')}
                hint={t('emptyState.onboarding.nextStepHint')}
                phoneLabel={t('emptyState.onboarding.testPhoneLabel')}
                phonePlaceholder={t(
                  'emptyState.onboarding.testPhonePlaceholder'
                )}
                invalidPhoneMessage={t(
                  'emptyState.onboarding.testPhoneInvalid'
                )}
                sendLabel={t('emptyState.onboarding.testSendLabel')}
                sendingLabel={t('emptyState.onboarding.testSendingLabel')}
                isSendingTest={isSendingTest}
                onSendTestVerification={onSendTestVerification}
              />
            )}
          </div>
        ) : (
          <EmptyState message={t('orders.empty.filtered')} />
        )}
      </div>
    </section>
  )
}
