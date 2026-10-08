'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { creditFeedbackKey } from '@/shared/lib/creditFeedback'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard, notify } from '@/shared/ui'
import { useConfirmationsList } from '../../domain/useConfirmationsList'
import { useManualConfirmation } from '../../domain/useManualConfirmation'
import { useOutcomeSyncRetry } from '../../domain/useOutcomeSyncRetry'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import { formatCount } from '../../lib/orderDisplay'
import type {
  ConfirmationsTab,
  DashboardStatsDateRange,
  VerificationItem,
} from '../../model/dashboard.model'
import { ManualConfirmDialog } from './components/ManualConfirmDialog'
import { StandaloneFeedbackBanners } from './components/StandaloneFeedbackBanners'
import { StandaloneVerificationsSkeleton } from './components/StandaloneVerificationsSkeleton'
import { CancelOrderDialog } from './components/confirmations/CancelOrderDialog'
import { ConfirmationsList } from './components/confirmations/ConfirmationsList'
import { ConfirmationsToolbar } from './components/confirmations/ConfirmationsToolbar'
import { VerificationDetailsSheet } from './components/confirmations/VerificationDetailsSheet'
import { PageHeader } from './components/shared/PageHeader'

export interface DashboardVerificationsStandaloneSkinProps {
  period: DashboardStatsDateRange
  periodOptions: ReadonlyArray<DateRangeFilterOption>
  onPeriodChange: (period: DashboardStatsDateRange) => void
  tab: ConfirmationsTab
  onTabChange: (tab: ConfirmationsTab) => void
  /** Narrows the list to the orders one import batch created. */
  importBatchId?: string
  /**
   * "Send it to my phone" (the free onboarding test), supplied by the page:
   * it belongs to the onboarding feature, which this one does not import.
   */
  phoneTestAction?: ReactNode
}

/**
 * Every order Akeed messaged, by outcome, searchable and paged — the same
 * list, filters and row actions as the embedded confirmations tab, plus what
 * only standalone has: imports, orders created by hand, and a free test to
 * the merchant's own phone while the list is still empty.
 */
export function DashboardVerificationsStandaloneSkin({
  period,
  periodOptions,
  onPeriodChange,
  tab,
  onTabChange,
  importBatchId,
  phoneTestAction,
}: DashboardVerificationsStandaloneSkinProps) {
  const t = useTranslations('dashboard')
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
  const storeSync = useOutcomeSyncRetry()
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

  const handleRetryStoreSync = async (row: VerificationItem) => {
    const result = await storeSync.retry(row.id)
    const message = t(`table.storeSync.retryResult.${result}`)
    const options = { message, id: 'confirmations-store-sync' }
    if (result === 'updated' || result === 'pending') notify.success(options)
    else notify.error(options)
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

  /*
   * From `md` the page is exactly one screen tall and only the table scrolls:
   * the viewport less the top bar (3.5rem) and the shell's padding around
   * `main` (3rem, 4rem from `lg`). The floor lets a very short window scroll
   * the page instead of squeezing the table away.
   */
  return (
    <div className="mx-auto w-full max-w-295 min-w-0 space-y-6 pt-2 pb-8 md:flex md:h-[calc(100dvh-6.5rem)] md:min-h-128 md:flex-col md:pb-0 lg:h-[calc(100dvh-7.5rem)]">
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
        testFeedback={null}
        onDismissTestFeedback={() => undefined}
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
        className={cn(akCard, 'overflow-hidden md:flex md:min-h-0 md:flex-col')}
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
          className="md:flex md:min-h-0 md:flex-col"
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
                {list.canSendTest && phoneTestAction && (
                  <div className="border-line space-y-3 border-t pt-5">
                    <div className="space-y-1">
                      <h3 className="text-ink text-sm font-semibold">
                        {t('verifications.empty.testHeading')}
                      </h3>
                      <p className="text-ink-muted text-sm">
                        {t('verifications.empty.testHint')}
                      </p>
                    </div>
                    {phoneTestAction}
                  </div>
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
                hasMore={list.hasNextPage}
                isLoadingMore={list.isFetchingNextPage}
                onLoadMore={list.onLoadMore}
                loadedLabel={t('confirmations.loaded', {
                  loaded: formatCount(list.rows.length, locale),
                  total: formatCount(list.total, locale),
                })}
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
            </>
          )}
        </div>
      </section>

      <VerificationDetailsSheet
        verification={detailsRow}
        timeZone={list.reportingTimezone}
        onClose={() => setDetailsId(null)}
        canRetrySync={list.canWrite}
        retryingSyncId={storeSync.retryingId}
        onRetrySync={(row) => void handleRetryStoreSync(row)}
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
