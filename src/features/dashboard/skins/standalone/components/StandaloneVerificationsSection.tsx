'use client'

import { useTranslations } from 'next-intl'
import { EmptyState } from '@/shared/ui'
import type {
  VerificationItem,
  VerificationStatusFilter,
} from '@/features/dashboard/model/dashboard.model'
import type { StatusFilterOption } from '@/features/dashboard/domain/dashboard.types'
import { VerificationsTableStandalone } from '../VerificationsTableStandalone'
import { StandaloneVerificationsSkeleton } from './StandaloneVerificationsSkeleton'
import { StandaloneTestVerificationPanel } from './StandaloneTestVerificationPanel'

interface StandaloneVerificationsSectionProps {
  verifications: VerificationItem[]
  reportingTimezone: string
  totalCount: number
  isVerificationsLoading: boolean
  hasMoreVerifications: boolean
  isLoadingMoreVerifications: boolean
  statusFilter: VerificationStatusFilter
  statusFilters: ReadonlyArray<StatusFilterOption>
  actingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  actionErrors: Record<string, string>
  canSendTestVerification: boolean
  canCancelOrders: boolean
  canRetryVerifications: boolean
  isSendingTest: boolean
  onStatusFilterChange: (filter: VerificationStatusFilter) => void
  onLoadMoreVerifications: () => Promise<void>
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>
  onRetryVerification: (verificationId: string) => Promise<void>
  onSendTestVerification: (customerPhone: string) => Promise<void>
}

export function StandaloneVerificationsSection({
  verifications,
  reportingTimezone,
  totalCount,
  isVerificationsLoading,
  hasMoreVerifications,
  isLoadingMoreVerifications,
  statusFilter,
  statusFilters,
  actingVerificationId,
  confirmingCancelVerificationId,
  actionErrors,
  canSendTestVerification,
  canCancelOrders,
  canRetryVerifications,
  isSendingTest,
  onStatusFilterChange,
  onLoadMoreVerifications,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  onRetryVerification,
  onSendTestVerification,
}: StandaloneVerificationsSectionProps) {
  const t = useTranslations('dashboard')

  return (
    <section
      aria-label={t('verifications.subtitle', { count: totalCount })}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 px-4 py-5 sm:px-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {t('verifications.filters.label')}
            </h2>
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => onStatusFilterChange('all')}
                className="text-xs font-medium text-emerald-700 underline-offset-4 hover:underline"
              >
                {t('verifications.filters.clear')}
              </button>
            )}
          </div>
          <div
            role="group"
            aria-label={t('verifications.filters.label')}
            className="flex flex-wrap gap-1.5"
          >
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={statusFilter === filter.id}
                onClick={() => onStatusFilterChange(filter.id)}
                className={`min-h-9 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  statusFilter === filter.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div aria-busy={isVerificationsLoading}>
        {!isVerificationsLoading &&
          !canSendTestVerification &&
          !canCancelOrders &&
          !canRetryVerifications && (
            <div
              role="status"
              className="m-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
            >
              {t('verifications.readOnlyNotice')}
            </div>
          )}
        {isVerificationsLoading ? (
          <StandaloneVerificationsSkeleton />
        ) : verifications.length ? (
          <div className="space-y-4">
            <VerificationsTableStandalone
              verifications={verifications}
              reportingTimezone={reportingTimezone}
              actingVerificationId={actingVerificationId}
              confirmingCancelVerificationId={confirmingCancelVerificationId}
              actionErrors={actionErrors}
              canCancelOrders={canCancelOrders}
              canRetryVerifications={canRetryVerifications}
              onRequestCancelOrder={onRequestCancelOrder}
              onDismissCancelOrder={onDismissCancelOrder}
              onConfirmCancelOrder={onConfirmCancelOrder}
              onRetryVerification={onRetryVerification}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:px-5">
              <p role="status" className="text-xs text-slate-500">
                {t('verifications.loaded', { count: verifications.length })}
              </p>
              {hasMoreVerifications && (
                <button
                  type="button"
                  disabled={isLoadingMoreVerifications}
                  onClick={() => void onLoadMoreVerifications()}
                  className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  {isLoadingMoreVerifications
                    ? t('verifications.loadingMore')
                    : t('verifications.loadMore')}
                </button>
              )}
            </div>
          </div>
        ) : statusFilter === 'all' ? (
          <div className="m-4 space-y-6 rounded-xl bg-slate-50 p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t('verifications.empty.title')}
              </h3>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                {t('verifications.empty.description')}
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
          <div className="p-6">
            <EmptyState message={t('verifications.empty.filtered')} />
          </div>
        )}
      </div>
    </section>
  )
}
