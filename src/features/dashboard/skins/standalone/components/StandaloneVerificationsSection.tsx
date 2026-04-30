'use client'

import { useTranslations } from 'next-intl'
import { EmptyState, LoadingSpinner } from '@/shared/ui'
import type { StatusFilterOption } from '@/features/dashboard/domain/dashboard.types'
import type {
  VerificationItem,
  VerificationStatusFilter,
} from '@/features/dashboard/model/dashboard.model'
import { VerificationsTableStandalone } from '../VerificationsTableStandalone'
import { StandaloneTestVerificationPanel } from './StandaloneTestVerificationPanel'

interface StandaloneVerificationsSectionProps {
  verifications: VerificationItem[]
  isVerificationsLoading: boolean
  hasMoreVerifications: boolean
  isLoadingMoreVerifications: boolean
  hasVerifications: boolean
  emptyVerificationsMessage: string
  cancelingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  cancelOrderErrors: Record<string, string>
  statusFilter: VerificationStatusFilter
  statusFilters: ReadonlyArray<StatusFilterOption>
  isSendingTest: boolean
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>
  onStatusFilterChange: (filter: VerificationStatusFilter) => void
  onLoadMoreVerifications: () => Promise<void>
  onSendTestVerification: (customerPhone: string) => Promise<void>
}

export function StandaloneVerificationsSection({
  verifications,
  isVerificationsLoading,
  hasMoreVerifications,
  isLoadingMoreVerifications,
  hasVerifications,
  emptyVerificationsMessage,
  cancelingVerificationId,
  confirmingCancelVerificationId,
  cancelOrderErrors,
  statusFilter,
  statusFilters,
  isSendingTest,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  onStatusFilterChange,
  onLoadMoreVerifications,
  onSendTestVerification,
}: StandaloneVerificationsSectionProps) {
  const t = useTranslations('dashboard')

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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

      <div className="px-6 py-5">
        {isVerificationsLoading ? (
          <div className="py-8">
            <LoadingSpinner message={t('verificationSection.loading')} />
          </div>
        ) : hasVerifications ? (
          <div className="space-y-4">
            <VerificationsTableStandalone
              verifications={verifications}
              cancelingVerificationId={cancelingVerificationId}
              confirmingCancelVerificationId={confirmingCancelVerificationId}
              cancelOrderErrors={cancelOrderErrors}
              onRequestCancelOrder={onRequestCancelOrder}
              onDismissCancelOrder={onDismissCancelOrder}
              onConfirmCancelOrder={onConfirmCancelOrder}
            />
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

              <ol className="space-y-3">
                {(['step1', 'step2', 'step3'] as const).map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-sm text-slate-600">
                      {t(`emptyState.onboarding.${step}`)}
                    </span>
                  </li>
                ))}
              </ol>

              <StandaloneTestVerificationPanel
                heading={t('emptyState.onboarding.testSectionHeading')}
                hint={t('emptyState.onboarding.nextStepHint')}
                phoneLabel={t('emptyState.onboarding.testPhoneLabel')}
                phonePlaceholder={t(
                  'emptyState.onboarding.testPhonePlaceholder'
                )}
                sendLabel={t('emptyState.onboarding.testSendLabel')}
                sendingLabel={t('emptyState.onboarding.testSendingLabel')}
                isSendingTest={isSendingTest}
                onSendTestVerification={onSendTestVerification}
              />
            </div>
          </div>
        ) : (
          <EmptyState message={emptyVerificationsMessage} />
        )}
      </div>
    </section>
  )
}
