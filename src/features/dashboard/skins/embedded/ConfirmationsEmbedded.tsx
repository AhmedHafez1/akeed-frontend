'use client'

import { useState } from 'react'
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  Modal,
  Tabs,
  Text,
  TextField,
  useBreakpoints,
} from '@shopify/polaris'
import { SearchIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { CONFIRMATIONS_TABS } from '../../domain/confirmationsUrlState'
import { useConfirmationsList } from '../../domain/useConfirmationsList'
import { useManualConfirmation } from '../../domain/useManualConfirmation'
import { formatCount } from '../../lib/orderDisplay'
import type { DateRangeFilterOption } from '../../domain/dashboard.types'
import type {
  ConfirmationsTab,
  DashboardStatsDateRange,
  VerificationItem,
} from '../../model/dashboard.model'
import { ConfirmationsCardList } from './components/confirmations/ConfirmationsCardList'
import { ConfirmationsTable } from './components/confirmations/ConfirmationsTable'
import { EmbeddedPageHeader } from './components/overview/EmbeddedPageHeader'
import { ManualConfirmModal } from './components/shared/ManualConfirmModal'
import { VerificationsTableSkeleton } from './components/VerificationsTableSkeleton'

type Feedback = { tone: 'success' | 'critical'; message: string }

interface ConfirmationsEmbeddedProps {
  period: DashboardStatsDateRange
  periodOptions: ReadonlyArray<DateRangeFilterOption>
  onPeriodChange: (period: DashboardStatsDateRange) => void
  tab: ConfirmationsTab
  onTabChange: (tab: ConfirmationsTab) => void
}

/** Every COD order we messaged, by outcome, searchable and paged. */
export function ConfirmationsEmbedded({
  period,
  periodOptions,
  onPeriodChange,
  tab,
  onTabChange,
}: ConfirmationsEmbeddedProps) {
  const t = useTranslations('dashboard')
  const { locale } = useLocaleInfo()
  const list = useConfirmationsList({ dateRange: period, tab })
  const confirmation = useManualConfirmation()
  // Six columns do not fit a phone; below md each order becomes a card.
  const { mdUp } = useBreakpoints({ defaults: { mdUp: true } })
  const ConfirmationsList = mdUp ? ConfirmationsTable : ConfirmationsCardList
  const [cancelTarget, setCancelTarget] = useState<{
    row: VerificationItem
    orderLabel: string
  } | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const tabs = CONFIRMATIONS_TABS.map((id) => {
    const count = list.tabCounts?.[id]
    return {
      id: `confirmations-tab-${id}`,
      content: t(`confirmations.tabs.${id}`),
      badge: count === undefined ? undefined : formatCount(count, locale),
      accessibilityLabel:
        count === undefined
          ? t(`confirmations.tabs.${id}`)
          : `${t(`confirmations.tabs.${id}`)} (${formatCount(count, locale)})`,
      panelID: 'confirmations-panel',
    }
  })

  const handleRetry = async (row: VerificationItem) => {
    setFeedback(null)
    const result = await list.onRetry(row.id, row.order_id)
    setFeedback(
      result.status === 'success'
        ? { tone: 'success', message: t('table.actions.retrySuccess') }
        : { tone: 'critical', message: t('table.actions.retryError') }
    )
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    const result = await list.onCancel(cancelTarget.row.id)
    setCancelTarget(null)
    setFeedback(
      result.status === 'success'
        ? { tone: 'success', message: t('table.actions.cancelOrderSuccess') }
        : { tone: 'critical', message: t('table.actions.cancelOrderError') }
    )
  }

  const confirmationFeedback: Feedback | null = confirmation.feedback
    ? confirmation.feedback.tone === 'success'
      ? {
          tone: 'success',
          message: t('overview.needsAction.confirmDialog.success', {
            order: confirmation.feedback.orderLabel,
          }),
        }
      : {
          tone: 'critical',
          message: t('overview.needsAction.confirmDialog.error'),
        }
    : null
  const shownFeedback = confirmationFeedback ?? feedback

  const emptyMessage = list.search
    ? t('confirmations.empty.search', { query: list.search })
    : t(`confirmations.empty.${tab}`)

  return (
    <BlockStack gap="500">
      <EmbeddedPageHeader
        title={t('confirmations.title')}
        subtitle={t('confirmations.subtitle')}
        periodLabel={t('overview.periodLabel')}
        period={period}
        periodOptions={periodOptions}
        onPeriodChange={onPeriodChange}
      />

      {shownFeedback && (
        <Banner
          tone={shownFeedback.tone}
          onDismiss={() => {
            confirmation.dismissFeedback()
            setFeedback(null)
          }}
        >
          <p>{shownFeedback.message}</p>
        </Banner>
      )}

      <Card padding="0">
        <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Tabs
              tabs={tabs}
              selected={CONFIRMATIONS_TABS.indexOf(tab)}
              onSelect={(index) => onTabChange(CONFIRMATIONS_TABS[index])}
            />
          </div>
          <div className="w-full lg:w-80">
            <TextField
              label={t('confirmations.search.label')}
              labelHidden
              type="search"
              inputMode="tel"
              autoComplete="off"
              placeholder={t('confirmations.search.placeholder')}
              prefix={<Icon source={SearchIcon} tone="subdued" />}
              value={list.searchInput}
              onChange={list.onSearchChange}
              clearButton
              onClearButtonClick={list.onSearchClear}
              maxLength={32}
              error={
                list.isSearchValid
                  ? undefined
                  : t('confirmations.search.invalid')
              }
            />
          </div>
        </div>

        <div
          id="confirmations-panel"
          role="tabpanel"
          aria-busy={list.isFetching}
        >
          {list.isLoading ? (
            <VerificationsTableSkeleton />
          ) : list.isError ? (
            <Box padding="400">
              <Banner tone="critical" title={t('confirmations.error.title')}>
                <Button onClick={list.retry}>
                  {t('confirmations.error.retry')}
                </Button>
              </Banner>
            </Box>
          ) : list.rows.length === 0 ? (
            <Box padding="800">
              <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                {emptyMessage}
              </Text>
            </Box>
          ) : (
            <ConfirmationsList
              rows={list.rows}
              timeZone={list.reportingTimezone}
              canWrite={list.canWrite}
              canRetry={list.canRetry}
              actingId={list.actingId}
              handlers={{
                onRequestConfirm: (row, orderLabel) =>
                  confirmation.request({ verificationId: row.id, orderLabel }),
                onRequestCancel: (row, orderLabel) =>
                  setCancelTarget({ row, orderLabel }),
                onRetry: (row) => void handleRetry(row),
              }}
              pagination={{
                label: t('confirmations.pagination.label', {
                  from: formatCount(list.range.from, locale),
                  to: formatCount(list.range.to, locale),
                  total: formatCount(list.range.total, locale),
                }),
                hasNext: list.hasNextPage,
                hasPrevious: list.hasPreviousPage,
                onNext: list.onNextPage,
                onPrevious: list.onPreviousPage,
                previousLabel: t('confirmations.pagination.previous'),
                nextLabel: t('confirmations.pagination.next'),
              }}
            />
          )}
        </div>
      </Card>

      <ManualConfirmModal
        target={confirmation.target}
        isConfirming={confirmation.isConfirming}
        onConfirm={() => void confirmation.confirm()}
        onDismiss={confirmation.dismiss}
      />
      <Modal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title={t('confirmations.actions.cancelTitle', {
          order: cancelTarget?.orderLabel ?? '',
        })}
        primaryAction={{
          content: t('table.actions.confirmCancelOrder'),
          destructive: true,
          loading: list.actingId !== null,
          onAction: () => void handleCancel(),
        }}
        secondaryActions={[
          {
            content: t('table.actions.keepOrder'),
            onAction: () => setCancelTarget(null),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p" variant="bodyMd">
            {t('table.actions.cancelOrderConfirmDescription')}
          </Text>
        </Modal.Section>
      </Modal>
    </BlockStack>
  )
}
