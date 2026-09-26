'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useStandaloneShell } from '@/shared/layout/StandaloneShellContext'
import { Button, Card, Skeleton, notify } from '@/shared/ui'
import { CreditsBadge } from '@/features/billing/ui/components/CreditsBadge'
import { useDashboardOverview } from '../../domain/useDashboardOverview'
import { useManualConfirmation } from '../../domain/useManualConfirmation'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'
import { ManualConfirmDialog } from './components/ManualConfirmDialog'
import { WelcomeCreditsModal } from './components/WelcomeCreditsModal'
import { KpiCards } from './components/overview/KpiCards'
import { MessageFlowCard } from './components/overview/MessageFlowCard'
import { NeedsActionCard } from './components/overview/NeedsActionCard'
import { SettingsStatusLine } from './components/overview/SettingsStatusLine'
import { StandalonePageHeader } from './components/overview/StandalonePageHeader'
import { UsageBar } from './components/overview/UsageBar'

export interface DashboardStandaloneSkinProps {
  period: DashboardStatsDateRange
  periodOptions: ReadonlyArray<DateRangeFilterOption>
  onPeriodChange: (period: DashboardStatsDateRange) => void
  /** The confirmations list filtered to what needs action, same period. */
  needsActionHref: string
}

function OverviewSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Card key={key} className="space-y-3 p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-4 w-40" />
          </Card>
        ))}
      </div>
      <Card className="space-y-4 p-5">
        <Skeleton className="h-6 w-40" />
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </Card>
      <Card className="space-y-4 p-5">
        <Skeleton className="h-6 w-36" />
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-6 w-full" />
        ))}
      </Card>
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
  needsActionHref,
}: DashboardStandaloneSkinProps) {
  const t = useTranslations('dashboard')
  const { identity, isIdentityLoading } = useStandaloneShell()
  const { overview, isLoading, isError, retry } = useDashboardOverview(period)
  const confirmation = useManualConfirmation()
  const { feedback, dismissFeedback } = confirmation
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Deliberately deferred to an effect (rather than a lazy useState
  // initializer) so the first client render matches the server-rendered
  // markup and hydration never sees a dialog that's already open.
  useEffect(() => {
    try {
      const justCompleted = window.sessionStorage.getItem(
        'akeed:onboarding-just-completed'
      )
      if (justCompleted) {
        window.sessionStorage.removeItem('akeed:onboarding-just-completed')
        // One-shot consumption of a flag set just before the redirect into
        // this page; there's no prop/state to derive this from during render.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowWelcomeModal(true)
      }
    } catch {
      // Storage unavailable — modal just doesn't show.
    }
  }, [])

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

  const title = isIdentityLoading ? (
    <span
      aria-label={t('standalone.greetingLoading')}
      className="bg-border inline-block h-9 w-64 max-w-full animate-pulse rounded-lg align-middle"
    />
  ) : identity.fullName ? (
    t('standalone.greeting', { name: identity.fullName })
  ) : (
    t('overview.title')
  )

  return (
    <div className="mx-auto w-full max-w-350 space-y-6 pb-8">
      <StandalonePageHeader
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
        actions={<CreditsBadge />}
      />

      {isLoading ? (
        <OverviewSkeleton />
      ) : isError || !overview ? (
        <div
          role="alert"
          className="border-destructive-border bg-destructive-subtle rounded-card flex flex-col items-start gap-3 border p-5"
        >
          <div>
            <p className="text-destructive-subtle-foreground font-semibold">
              {t('overview.error.title')}
            </p>
            <p className="text-destructive-subtle-foreground mt-1 text-sm">
              {t('overview.unavailable')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={retry}>
            {t('overview.error.retry')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {overview.usage && <UsageBar usage={overview.usage} />}
          <KpiCards kpis={overview.kpis} />
          <NeedsActionCard
            needsAction={overview.needs_action}
            timeZone={overview.reporting_timezone}
            canConfirm={overview.permissions?.can_confirm_orders === true}
            onRequestConfirm={confirmation.request}
            viewAllHref={needsActionHref}
          />
          <MessageFlowCard funnel={overview.funnel} />
        </div>
      )}

      <ManualConfirmDialog
        target={confirmation.target}
        isConfirming={confirmation.isConfirming}
        onConfirm={() => void confirmation.confirm()}
        onDismiss={confirmation.dismiss}
      />
      <WelcomeCreditsModal
        open={showWelcomeModal}
        onOpenChange={setShowWelcomeModal}
      />
    </div>
  )
}
