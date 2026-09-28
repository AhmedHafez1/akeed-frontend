'use client'

import { useEffect, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { creditFeedbackKey } from '@/shared/lib/creditFeedback'
import { cn } from '@/shared/lib/utils'
import { notify } from '@/shared/ui'
import { useConfirmationsList } from '../../domain/useConfirmationsList'
import { useManualConfirmation } from '../../domain/useManualConfirmation'
import { useTestVerificationSend } from '../../domain/useTestVerificationSend'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import { formatCount } from '../../lib/orderDisplay'
import type {
  ConfirmationsTab,
  DashboardStatsDateRange,
  VerificationItem,
} from '../../model/dashboard.model'
import { ManualConfirmDialog } from './components/ManualConfirmDialog'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneTestVerificationPanel } from './components/StandaloneTestVerificationPanel'
import { StandaloneVerificationsSkeleton } from './components/StandaloneVerificationsSkeleton'
import { CancelOrderDialog } from './components/confirmations/CancelOrderDialog'
import { ConfirmationsList } from './components/confirmations/ConfirmationsList'
import { ConfirmationsPager } from './components/confirmations/ConfirmationsPager'
import { ConfirmationsToolbar } from './components/confirmations/ConfirmationsToolbar'
import { VerificationDetailsSheet } from './components/confirmations/VerificationDetailsSheet'
import { PageHeader } from './components/shared/PageHeader'
import { akButton, akCard } from './components/shared/akStyles'

export interface DashboardVerificationsStandaloneSkinProps {
  period: DashboardStatsDateRange
  periodOptions: ReadonlyArray<DateRangeFilterOption>
  onPeriodChange: (period: DashboardStatsDateRange) => void
  tab: ConfirmationsTab
  onTabChange: (tab: ConfirmationsTab) => void
  /** Narrows the list to the orders one import batch created. */
  importBatchId?: string
}

/**
 * Every order Akeed messaged, by outcome, searchable and paged — the same
 * list, filters and row actions as the embedded confirmations tab, plus what
 * only standalone has: imports, orders created by hand, and a test send.
 */
export function DashboardVerificationsStandaloneSkin({
  period,
  periodOptions,
  onPeriodChange,
  tab,
  onTabChange,
  importBatchId,
}: DashboardVerificationsStandaloneSkinProps) {
  const t = useTranslations('dashboard')
  const tTable = useTranslations('dashboard.standalone.table')
  const tabIdPrefix = useId()
  const panelId = `${tabIdPrefix}-panel`
  const tCredits = useTranslations('creditErrors')
  const { locale } = useLocaleInfo()
  const list = useConfirmationsList({
    dateRange: period,
    tab,
    importBatchId,
    showPendingOrders: true,
  })
  const confirmation = useManualConfirmation()
  const test = useTestVerificationSend(list.canSendTest)
  const [cancelTarget, setCancelTarget] = useState<{
    row: VerificationItem
    orderLabel: string
  } | null>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  // Looked up on every render so the sheet follows the row as it updates.
  const detailsRow = list.rows.find((row) => row.id === detailsId) ?? null

  const { feedback, dismissFeedback } = confirmation
  useEffect(() => {
    if (!feedback) return
    if (feedback.tone === 'success') {
      notify.success({
        message: t('overview.needsAction.confirmDialog.success', {
          order: feedback.orderLabel,
        }),
        id: 'confirmations-manual-confirm',
      })
    } else {
      notify.error({
        message: t('overview.needsAction.confirmDialog.error'),
        id: 'confirmations-manual-confirm',
      })
    }
    dismissFeedback()
  }, [dismissFeedback, feedback, t])

  // A sent or skipped test is a passing note; a failed one stays on screen.
  const { testFeedback, onDismissTestFeedback } = test
  useEffect(() => {
    if (!testFeedback || testFeedback.tone === 'critical') return
    const show =
      testFeedback.tone === 'success' ? notify.success : notify.warning
    show({ message: testFeedback.message, id: 'confirmations-test-feedback' })
    onDismissTestFeedback()
  }, [onDismissTestFeedback, testFeedback])

  const handleRetry = async (row: VerificationItem) => {
    const result = await list.onRetry(row.id, row.order_id)
    if (result.status === 'success') {
      notify.success({
        message: t('table.actions.retrySuccess'),
        id: 'confirmations-row-action',
      })
      return
    }
    const creditKey = creditFeedbackKey(result.code)
    notify.error({
      message: creditKey ? tCredits(creditKey) : t('table.actions.retryError'),
      id: 'confirmations-row-action',
    })
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    const result = await list.onCancel(cancelTarget.row.id)
    setCancelTarget(null)
    if (result.status === 'success') {
      notify.success({
        message: t('table.actions.cancelOrderSuccess'),
        id: 'confirmations-row-action',
      })
    } else {
      notify.error({
        message: t('table.actions.cancelOrderError'),
        id: 'confirmations-row-action',
      })
    }
  }

  const isReadOnly =
    !list.isLoading && !list.canWrite && !list.canRetry && !list.canSendTest
  const isOnboarding =
    tab === 'all' && !list.search && !importBatchId && list.rows.length === 0

  return (
    <div className="mx-auto w-full max-w-295 min-w-0 space-y-6 pt-2 pb-8">
      <PageHeader
        title={t('confirmations.title')}
        subtitle={t('confirmations.subtitle')}
        periodLabel={t('overview.periodLabel')}
        period={period}
        periodOptions={periodOptions}
        onPeriodChange={onPeriodChange}
      />

      <StandaloneFeedbackBanners
        error={null}
        testFeedback={
          test.testFeedback?.tone === 'critical' ? test.testFeedback : null
        }
        onDismissTestFeedback={test.onDismissTestFeedback}
        creditDenialCode={list.creditDenialCode}
      />

      {list.sourceStatus === 'disconnected' && (
        <div
          role="status"
          className="border-ak-warning-line bg-ak-warning-soft text-ak-warning rounded-ak-card border px-6 py-4"
        >
          <p className="text-ak-body font-semibold">
            {t('sourceDisconnectedTitle')}
          </p>
          <p className="text-ak-body mt-1">
            {t('sourceDisconnectedDescription')}
          </p>
        </div>
      )}

      {isReadOnly && (
        <div
          role="status"
          className="border-ak-info/20 bg-ak-info-soft text-ak-info rounded-ak-card text-ak-body border px-6 py-4"
        >
          {t('verifications.readOnlyNotice')}
        </div>
      )}

      <section
        aria-label={t('confirmations.title')}
        className={cn(akCard, 'overflow-hidden')}
      >
        <ConfirmationsToolbar
          tab={tab}
          tabCounts={list.tabCounts}
          onTabChange={onTabChange}
          panelId={panelId}
          tabIdPrefix={tabIdPrefix}
          searchInput={list.searchInput}
          isSearchValid={list.isSearchValid}
          onSearchChange={list.onSearchChange}
          onSearchClear={list.onSearchClear}
        />

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`${tabIdPrefix}-${tab}`}
          aria-busy={list.isFetching}
        >
          {list.isLoading ? (
            <StandaloneVerificationsSkeleton />
          ) : list.isError ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 px-6 py-10 text-center"
            >
              <p className="text-ak-body text-ink font-semibold">
                {t('confirmations.error.title')}
              </p>
              <button
                type="button"
                onClick={list.retry}
                className={akButton({ variant: 'secondary', size: 'row' })}
              >
                {t('confirmations.error.retry')}
              </button>
            </div>
          ) : list.rows.length === 0 ? (
            isOnboarding ? (
              <div className="bg-card rounded-ak-card m-4 space-y-6 p-6">
                <div>
                  <h2 className="text-ak-section text-ink">
                    {t('verifications.empty.title')}
                  </h2>
                  <p className="text-ak-body text-ink-muted mt-2 max-w-xl">
                    {t('verifications.empty.description')}
                  </p>
                </div>
                {list.canSendTest && (
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
                    isSendingTest={test.isSendingTest}
                    onSendTestVerification={test.onSendTestVerification}
                  />
                )}
              </div>
            ) : (
              <p className="text-ak-body text-ink-muted px-6 py-12 text-center">
                {list.search
                  ? t('confirmations.empty.search', { query: list.search })
                  : t(`confirmations.empty.${tab}`)}
              </p>
            )
          ) : (
            <>
              <ConfirmationsList
                rows={list.rows}
                timeZone={list.reportingTimezone}
                canWrite={list.canWrite}
                canRetry={list.canRetry}
                actingId={list.actingId}
                handlers={{
                  onOpenDetails: (row) => setDetailsId(row.id),
                  onRequestConfirm: (row, orderLabel) =>
                    confirmation.request({
                      verificationId: row.id,
                      orderLabel,
                    }),
                  onRequestCancel: (row, orderLabel) =>
                    setCancelTarget({ row, orderLabel }),
                  onRetry: (row) => void handleRetry(row),
                }}
              />
              <ConfirmationsPager
                label={t('confirmations.pagination.label', {
                  from: formatCount(list.range.from, locale),
                  to: formatCount(list.range.to, locale),
                  total: formatCount(list.range.total, locale),
                })}
                summary={tTable.rich('showing', {
                  from: formatCount(list.range.from, locale),
                  to: formatCount(list.range.to, locale),
                  total: list.range.total,
                  b: (chunks) => (
                    <bdi className="text-ink font-semibold">{chunks}</bdi>
                  ),
                })}
                hasPrevious={list.hasPreviousPage}
                hasNext={list.hasNextPage}
                onPrevious={list.onPreviousPage}
                onNext={list.onNextPage}
                previousLabel={tTable('previous')}
                nextLabel={tTable('next')}
              />
            </>
          )}
        </div>
      </section>

      <VerificationDetailsSheet
        verification={detailsRow}
        timeZone={list.reportingTimezone}
        onClose={() => setDetailsId(null)}
      />
      <ManualConfirmDialog
        target={confirmation.target}
        isConfirming={confirmation.isConfirming}
        onConfirm={() => void confirmation.confirm()}
        onDismiss={confirmation.dismiss}
      />
      <CancelOrderDialog
        orderLabel={cancelTarget?.orderLabel ?? null}
        isCanceling={list.actingId !== null}
        onConfirm={() => void handleCancel()}
        onDismiss={() => setCancelTarget(null)}
      />
    </div>
  )
}
