'use client'

import { useTranslations } from 'next-intl'
import { ChevronDown, Info } from 'lucide-react'
import { Tooltip } from '@/shared/ui'
import { CreditsBadge } from '@/features/billing/ui/components/CreditsBadge'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneVerificationsSection } from './components/StandaloneVerificationsSection'
import { VerificationOutcomePanel } from './components/VerificationOutcomePanel'
import type { DashboardSkinProps } from '../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'

export function DashboardVerificationsStandaloneSkin(
  props: DashboardSkinProps
) {
  const t = useTranslations('dashboard')

  return (
    <div className="mx-auto w-full max-w-350 min-w-0 space-y-6">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">
            {t('verifications.eyebrow')}
          </p>
          <h1 className="text-foreground flex items-center gap-2 text-3xl leading-tight font-bold tracking-tight">
            {t('verifications.title')}
            <Tooltip content={t('verifications.pageSubtitle')}>
              <Info
                aria-hidden="true"
                className="text-muted-foreground/70 size-5"
              />
              <span className="sr-only">{t('verifications.pageSubtitle')}</span>
            </Tooltip>
          </h1>
        </div>
        <div className="flex flex-wrap items-start gap-3 md:items-end md:justify-end">
          <label className="text-muted-foreground relative min-w-0 flex-1 text-sm sm:flex-none">
            <span className="sr-only">{t('filters.dateRange.label')}</span>
            <select
              value={props.dateRangeFilter}
              onChange={(event) =>
                props.onDateRangeFilterChange(
                  event.target.value as DashboardStatsDateRange
                )
              }
              className="border-input bg-card text-foreground/80 focus:border-primary focus:ring-primary-border h-10 w-full appearance-none rounded-lg border py-2 ps-3 pe-10 text-sm font-medium shadow-sm transition focus:ring-2 focus:outline-none sm:w-auto"
            >
              {props.dateRangeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2"
            />
          </label>
          <CreditsBadge />
        </div>
      </header>

      {/* The period total lives here, not beside the title: the list's own
          count follows the status filter, and printing both up top put two
          different totals a few centimetres apart. */}
      <VerificationOutcomePanel
        stats={props.stats}
        label={t('verifications.workload.label')}
        dateRangeFilter={props.dateRangeFilter}
        isLoading={props.isStatsLoading}
        statusFilter={props.statusFilter}
        onStatusFilterChange={props.onStatusFilterChange}
      />

      <StandaloneFeedbackBanners
        error={props.error}
        testFeedback={props.testFeedback}
        actionFeedback={props.actionFeedback}
        onDismissTestFeedback={props.onDismissTestFeedback}
        onDismissActionFeedback={props.onDismissActionFeedback}
        creditDenialCode={props.creditDenialCode}
      />

      {props.sourceStatus === 'disconnected' && (
        <div
          role="status"
          className="border-warning-border bg-warning-subtle text-warning-subtle-foreground rounded-xl border px-4 py-3"
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
        hasLoadMoreError={props.hasLoadMoreError}
        statusFilter={props.statusFilter}
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
