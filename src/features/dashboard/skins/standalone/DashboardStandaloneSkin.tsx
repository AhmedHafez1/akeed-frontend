'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Skeleton, akButton, akCard, notify } from '@/shared/ui'
import { useCancelVerificationMutation } from '../../api/verificationMutations'
import { manualConfirmationsAfterSend } from '../../domain/overviewMetrics'
import { useDashboardOverview } from '../../domain/useDashboardOverview'
import { useManualConfirmation } from '../../domain/useManualConfirmation'
import type { ManualConfirmationTarget } from '../../domain/useManualConfirmation'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import type {
  ConfirmationsTab,
  DashboardStatsDateRange,
} from '../../model/dashboard.model'
import { ManualConfirmDialog } from './components/ManualConfirmDialog'
import { KpiCards } from './components/overview/KpiCards'
import { MessageFlowCard } from './components/overview/MessageFlowCard'
import { NeedsActionCard } from './components/overview/NeedsActionCard'
import { SettingsStatusLine } from './components/overview/SettingsStatusLine'
import { UsageBar } from './components/overview/UsageBar'
import { CancelOrderDialog } from './components/confirmations/CancelOrderDialog'
import { PageHeader } from './components/shared/PageHeader'

export interface DashboardStandaloneSkinProps {
  period: DashboardStatsDateRange
  periodOptions: ReadonlyArray<DateRangeFilterOption>
  onPeriodChange: (period: DashboardStatsDateRange) => void
  /** The confirmations list for a tab, in the same period. */
  confirmationsHref: (tab: ConfirmationsTab) => string
}

function OverviewSkeleton() {
  const card = cn(akCard, 'space-y-3 px-6 py-5')
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className={card}>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>
      <div className={card}>
        <Skeleton className="h-6 w-40" />
        {[0, 1].map((key) => (
          <Skeleton key={key} className="h-14 w-full" />
        ))}
      </div>
      <div className={card}>
        <Skeleton className="h-6 w-36" />
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

/**
 * The standalone dashboard: settings, usage, three KPIs, the orders waiting
 * on the merchant, and the message funnel — the same story, in the same
 * order, as the embedded dashboard.
 */
export function DashboardStandaloneSkin({
  period,
  periodOptions,
  onPeriodChange,
  confirmationsHref,
}: DashboardStandaloneSkinProps) {
  const t = useTranslations('dashboard')
  const { overview, isLoading, isError, retry } = useDashboardOverview(period)
  const confirmation = useManualConfirmation()
  const { feedback, dismissFeedback } = confirmation
  const cancelMutation = useCancelVerificationMutation()
  const [cancelTarget, setCancelTarget] =
    useState<ManualConfirmationTarget | null>(null)

  useEffect(() => {
    if (!feedback) return
    if (feedback.tone === 'success') {
      notify.success({
        message: t('overview.needsAction.confirmDialog.success', {
          order: feedback.orderLabel,
        }),
        id: 'dashboard-manual-confirm',
      })
    } else {
      notify.error({
        message: t('overview.needsAction.confirmDialog.error'),
        id: 'dashboard-manual-confirm',
      })
    }
    dismissFeedback()
  }, [dismissFeedback, feedback, t])

  const handleCancel = async () => {
    if (!cancelTarget) return
    const succeeded = await cancelMutation
      .mutateAsync(cancelTarget.verificationId)
      .then(
        () => true,
        (error: unknown) => {
          console.error('[Dashboard] Failed to cancel order:', error)
          return false
        }
      )
    setCancelTarget(null)
    const show = succeeded ? notify.success : notify.error
    show({
      message: t(
        succeeded
          ? 'table.actions.cancelOrderSuccess'
          : 'table.actions.cancelOrderError'
      ),
      id: 'dashboard-cancel-order',
    })
  }

  const title = t('overview.title')

  return (
    <div className="mx-auto w-full max-w-295 space-y-6 pt-2 pb-8">
      <PageHeader
        title={title}
        subtitle={
          overview ? (
            <SettingsStatusLine settings={overview.settings} />
          ) : undefined
        }
        periodLabel={t('overview.periodLabel')}
        period={period}
        periodOptions={periodOptions}
        onPeriodChange={onPeriodChange}
      />

      {isLoading ? (
        <OverviewSkeleton />
      ) : isError || !overview ? (
        <div
          role="alert"
          className="border-ak-danger/30 bg-ak-danger-soft rounded-ak-card flex flex-col items-start gap-3 border px-6 py-5"
        >
          <div>
            <p className="text-ak-body text-ak-danger font-semibold">
              {t('overview.error.title')}
            </p>
            <p className="text-ak-body text-ak-danger mt-1">
              {t('overview.unavailable')}
            </p>
          </div>
          <button
            type="button"
            onClick={retry}
            className={akButton({ variant: 'secondary', size: 'row' })}
          >
            {t('overview.error.retry')}
          </button>
        </div>
      ) : (
        <>
          {overview.usage && <UsageBar usage={overview.usage} />}
          <KpiCards
            kpis={overview.kpis}
            confirmedHref={confirmationsHref('confirmed')}
            canceledHref={confirmationsHref('canceled')}
          />
          <NeedsActionCard
            needsAction={overview.needs_action}
            timeZone={overview.reporting_timezone}
            canConfirm={overview.permissions?.can_confirm_orders === true}
            onRequestConfirm={confirmation.request}
            onRequestCancel={setCancelTarget}
            viewAllHref={confirmationsHref('needs_action')}
          />
          <MessageFlowCard
            funnel={overview.funnel}
            manualConfirmed={manualConfirmationsAfterSend(overview)}
          />
        </>
      )}

      <ManualConfirmDialog
        target={confirmation.target}
        isConfirming={confirmation.isConfirming}
        onConfirm={() => void confirmation.confirm()}
        onDismiss={confirmation.dismiss}
      />
      <CancelOrderDialog
        orderLabel={cancelTarget?.orderLabel ?? null}
        isCanceling={cancelMutation.isPending}
        onConfirm={() => void handleCancel()}
        onDismiss={() => setCancelTarget(null)}
      />
    </div>
  )
}
