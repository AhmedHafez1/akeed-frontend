'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EmptyState, SegmentedControl } from '@/shared/ui'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import {
  OUTCOME_STAGES,
  VERIFICATION_STATUS_FILTER_IDS,
  outcomeOfFilter,
} from '@/features/dashboard/domain/verificationFilters'
import type {
  VerificationItem,
  VerificationStatusFilter,
} from '@/features/dashboard/model/dashboard.model'
import { VerificationsTableStandalone } from '../VerificationsTableStandalone'
import { StandaloneVerificationsSkeleton } from './StandaloneVerificationsSkeleton'
import { StandaloneTestVerificationPanel } from './StandaloneTestVerificationPanel'
import { OUTCOME_LABEL_KEYS } from './VerificationOutcomePanel'

/** Whether `filters.status.*` carries a label for this filter. */
function isLabelledStatusFilter(
  filter: VerificationStatusFilter
): filter is (typeof VERIFICATION_STATUS_FILTER_IDS)[number] {
  return (VERIFICATION_STATUS_FILTER_IDS as readonly string[]).includes(filter)
}

interface StandaloneVerificationsSectionProps {
  verifications: VerificationItem[]
  reportingTimezone: string
  totalCount: number
  isVerificationsLoading: boolean
  hasMoreVerifications: boolean
  isLoadingMoreVerifications: boolean
  hasLoadMoreError: boolean
  statusFilter: VerificationStatusFilter
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
  hasLoadMoreError,
  statusFilter,
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
  const { rootRef, sentinelRef } = useInfiniteScroll({
    hasMore: hasMoreVerifications,
    isLoading: isLoadingMoreVerifications,
    hasError: hasLoadMoreError,
    onLoadMore: onLoadMoreVerifications,
  })
  // The outcome panel above picks the status; this bar only says what the list
  // is narrowed to and, where the outcome has stages, narrows it further.
  const outcome = outcomeOfFilter(statusFilter)
  const stages = outcome ? OUTCOME_STAGES[outcome] : []
  const activeLabel = outcome
    ? t(OUTCOME_LABEL_KEYS[outcome])
    : isLabelledStatusFilter(statusFilter)
      ? t(`filters.status.${statusFilter}`)
      : null

  return (
    <section
      aria-label={t('verifications.subtitle', { count: totalCount })}
      className="rounded-card border-border bg-card border"
    >
      {statusFilter !== 'all' && (
        <div className="border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b px-4 py-3 sm:px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
            {activeLabel && (
              <h2 className="text-sm font-semibold text-slate-900">
                {activeLabel}
              </h2>
            )}
            {outcome && stages.length > 0 && activeLabel && (
              // Wraps rather than scrolls: a stage pushed off the edge of a
              // phone has nothing to say it is there.
              <SegmentedControl<VerificationStatusFilter>
                aria-label={t('verifications.filters.stage', {
                  outcome: activeLabel,
                })}
                value={statusFilter}
                onChange={onStatusFilterChange}
                options={[
                  { value: outcome, label: t('filters.status.all') },
                  ...stages.map((stage) => ({
                    value: stage,
                    label: t(`verificationStatus.${stage}`),
                  })),
                ]}
                className="max-w-full flex-wrap"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => onStatusFilterChange('all')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            {t('verifications.filters.clear')}
          </button>
        </div>
      )}

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
            {/*
             * The rows scroll, not the page: the list grows as the merchant
             * reaches the end of it, and the filters above and the count below
             * have to stay put while that happens. `tabIndex` is what makes the
             * region scrollable by keyboard as well as by pointer.
             */}
            <div
              ref={rootRef}
              role="region"
              aria-label={t('verifications.title')}
              tabIndex={0}
              className="max-h-[60vh] overflow-x-hidden overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
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
              {/* Crossing into view is what asks for the next page. */}
              <div ref={sentinelRef} aria-hidden="true" className="h-px" />
              {isLoadingMoreVerifications && (
                <p className="px-4 py-3 text-xs text-slate-500">
                  {t('verifications.loadingMore')}
                </p>
              )}
            </div>
            <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 sm:px-5">
              <p
                role="status"
                aria-live="polite"
                className="text-xs text-slate-500"
              >
                {t('verifications.showing', {
                  loaded: verifications.length,
                  total: totalCount,
                })}
              </p>
              {/*
               * The only button left: scrolling loads the next page on its own,
               * but a failed page disarms the sentinel, and without this the
               * list would be stranded at whatever it had already loaded.
               */}
              {hasLoadMoreError && (
                <button
                  type="button"
                  onClick={() => void onLoadMoreVerifications()}
                  className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {t('verifications.loadMoreRetry')}
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
