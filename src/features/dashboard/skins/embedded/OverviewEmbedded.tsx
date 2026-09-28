'use client'

import { useState, type ReactNode } from 'react'
import {
  Banner,
  BlockStack,
  Button,
  Card,
  InlineGrid,
  SkeletonBodyText,
  SkeletonDisplayText,
  Text,
} from '@shopify/polaris'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { UpgradePlansModal } from '@/features/billing'
import { resolveEmbeddedContextFromSearch } from '@/shared/lib/embedded-context'
import { useDashboardOverview } from '../../domain/useDashboardOverview'
import { useManualConfirmation } from '../../domain/useManualConfirmation'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import type { DashboardStatsDateRange } from '../../model/dashboard.model'
import { CreditsBar } from './components/overview/CreditsBar'
import { EmbeddedPageHeader } from './components/overview/EmbeddedPageHeader'
import { KpiCards } from './components/overview/KpiCards'
import { MessageFlowCard } from './components/overview/MessageFlowCard'
import { NeedsActionCard } from './components/overview/NeedsActionCard'
import { SettingsStatusLine } from './components/overview/SettingsStatusLine'
import { ManualConfirmModal } from './components/shared/ManualConfirmModal'

function OverviewSkeleton() {
  return (
    <BlockStack gap="400">
      <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
        {[0, 1, 2].map((key) => (
          <Card key={key}>
            <BlockStack gap="300">
              <SkeletonBodyText lines={1} />
              <SkeletonDisplayText size="large" />
              <SkeletonBodyText lines={1} />
            </BlockStack>
          </Card>
        ))}
      </InlineGrid>
      <Card>
        <SkeletonBodyText lines={6} />
      </Card>
      <Card>
        <SkeletonBodyText lines={5} />
      </Card>
    </BlockStack>
  )
}

interface OverviewEmbeddedProps {
  period: DashboardStatsDateRange
  periodOptions: ReadonlyArray<DateRangeFilterOption>
  onPeriodChange: (period: DashboardStatsDateRange) => void
  titleMetadata?: ReactNode
  onEditSettings: () => void
  onViewNeedsAction: () => void
}

/** The embedded dashboard: settings, usage, three KPIs, actions, the funnel. */
export function OverviewEmbedded({
  period,
  periodOptions,
  onPeriodChange,
  titleMetadata,
  onEditSettings,
  onViewNeedsAction,
}: OverviewEmbeddedProps) {
  const t = useTranslations('dashboard.overview')
  const searchParams = useSearchParams()
  const { overview, isLoading, isError, retry } = useDashboardOverview(period)
  const confirmation = useManualConfirmation()
  const [isPlansOpen, setIsPlansOpen] = useState(false)
  const embeddedContext = resolveEmbeddedContextFromSearch(searchParams)

  return (
    <BlockStack gap="500">
      <EmbeddedPageHeader
        title={t('title')}
        titleMetadata={titleMetadata}
        subtitle={
          overview ? (
            <SettingsStatusLine
              settings={overview.settings}
              onEdit={onEditSettings}
            />
          ) : undefined
        }
        periodLabel={t('periodLabel')}
        period={period}
        periodOptions={periodOptions}
        onPeriodChange={onPeriodChange}
      />

      {confirmation.feedback && (
        <Banner
          tone={confirmation.feedback.tone}
          onDismiss={confirmation.dismissFeedback}
        >
          <p>
            {confirmation.feedback.tone === 'success'
              ? t('needsAction.confirmDialog.success', {
                  order: confirmation.feedback.orderLabel,
                })
              : t('needsAction.confirmDialog.error')}
          </p>
        </Banner>
      )}

      {isLoading ? (
        <OverviewSkeleton />
      ) : isError || !overview ? (
        <Banner tone="critical" title={t('error.title')}>
          <BlockStack gap="200" inlineAlign="start">
            <Text as="p">{t('unavailable')}</Text>
            <Button onClick={retry}>{t('error.retry')}</Button>
          </BlockStack>
        </Banner>
      ) : (
        <BlockStack gap="400">
          {overview.usage && (
            <CreditsBar
              usage={overview.usage}
              onChoosePlan={() => setIsPlansOpen(true)}
            />
          )}
          <KpiCards kpis={overview.kpis} />
          <NeedsActionCard
            needsAction={overview.needs_action}
            timeZone={overview.reporting_timezone}
            canConfirm={overview.permissions?.can_confirm_orders === true}
            onRequestConfirm={confirmation.request}
            onViewAll={onViewNeedsAction}
          />
          <MessageFlowCard funnel={overview.funnel} />
        </BlockStack>
      )}

      <ManualConfirmModal
        target={confirmation.target}
        isConfirming={confirmation.isConfirming}
        onConfirm={() => void confirmation.confirm()}
        onDismiss={confirmation.dismiss}
      />
      <UpgradePlansModal
        open={isPlansOpen}
        title={t('credits.plansModalTitle')}
        hostParam={embeddedContext.hostParam}
        onClose={() => setIsPlansOpen(false)}
      />
    </BlockStack>
  )
}
