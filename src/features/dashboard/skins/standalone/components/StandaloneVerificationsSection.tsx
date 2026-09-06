'use client'

import { useTranslations } from 'next-intl'
import { EmptyState, LoadingSpinner } from '@/shared/ui'
import type {
  VerificationItem,
  VerificationStatusFilter,
} from '@/features/dashboard/model/dashboard.model'
import type { StatusFilterOption } from '@/features/dashboard/domain/dashboard.types'
import { VerificationsTableStandalone } from '../VerificationsTableStandalone'
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
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t('verifications.title')}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t('verifications.subtitle', { count: totalCount })}
            </p>
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
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === filter.id
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
              {t('verifications.readOnlyNotice')}
            </div>
          )}
        {isVerificationsLoading ? (
          <div className="py-8">
            <LoadingSpinner message={t('verifications.loading')} />
          </div>
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
            {hasMoreVerifications && (
              <div className="flex justify-center pt-2">
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
              </div>
            )}
          </div>
        ) : statusFilter === 'all' ? (
          <div className="space-y-6 rounded-xl bg-slate-50 p-6">
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
          <EmptyState message={t('verifications.empty.filtered')} />
        )}
      </div>
    </section>
  )
}
