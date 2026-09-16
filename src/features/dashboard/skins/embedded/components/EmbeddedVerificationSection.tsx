import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Select,
  Text,
} from '@shopify/polaris'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import type { StatusFilterOption } from '@/features/dashboard/domain/dashboard.types'
import type {
  VerificationItem,
  VerificationStatusFilter,
} from '@/features/dashboard/model/dashboard.model'
import { DashboardEmptyState } from './DashboardEmptyState'
import { VerificationsTableSkeleton } from './VerificationsTableSkeleton'
import { VerificationsTableEmbedded } from '../VerificationsTableEmbedded'

interface EmbeddedVerificationMessages {
  title: string
  subtitle: string
  statusFilterLabel: string
  noReplyTooltip: string
  loadingMore: string
  loadMoreRetry: string
  /** Interpolated by the parent -- this section resolves no copy itself. */
  showing: string
  emptyMessage: string
  emptyState: {
    heading: string
    activeDescription: string
    step1: string
    step2: string
    step3: string
    testSectionHeading: string
    testPhoneLabel: string
    testPhonePlaceholder: string
    testSendLabel: string
    testSendingLabel: string
    nextStepHint: string
  }
}

interface EmbeddedVerificationSectionProps {
  messages: EmbeddedVerificationMessages
  verifications: VerificationItem[]
  isVerificationsLoading: boolean
  hasMoreVerifications: boolean
  isLoadingMoreVerifications: boolean
  hasLoadMoreError: boolean
  hasVerifications: boolean
  actingVerificationId: string | null
  confirmingCancelVerificationId: string | null
  actionErrors: Record<string, string>
  reportingTimezone: string
  canRetryVerifications: boolean
  onRetryVerification: (verificationId: string) => Promise<void>
  statusFilter: VerificationStatusFilter
  statusFilters: ReadonlyArray<StatusFilterOption>
  isSendingTest: boolean
  canSendTestVerification: boolean
  canCancelOrders: boolean
  onRequestCancelOrder: (verificationId: string) => void
  onDismissCancelOrder: (verificationId: string) => void
  onConfirmCancelOrder: (verificationId: string) => Promise<void>
  onStatusFilterChange: (filter: VerificationStatusFilter) => void
  onLoadMoreVerifications: () => Promise<void>
  onSendTestVerification: (customerPhone: string) => Promise<void>
}

export function EmbeddedVerificationSection({
  messages,
  verifications,
  isVerificationsLoading,
  hasMoreVerifications,
  isLoadingMoreVerifications,
  hasLoadMoreError,
  hasVerifications,
  actingVerificationId,
  confirmingCancelVerificationId,
  actionErrors,
  reportingTimezone,
  canRetryVerifications,
  onRetryVerification,
  statusFilter,
  statusFilters,
  isSendingTest,
  canSendTestVerification,
  canCancelOrders,
  onRequestCancelOrder,
  onDismissCancelOrder,
  onConfirmCancelOrder,
  onStatusFilterChange,
  onLoadMoreVerifications,
  onSendTestVerification,
}: EmbeddedVerificationSectionProps) {
  const { isRTL } = useLocaleInfo()
  const shouldShowEmptyState = !hasVerifications
  const { rootRef, sentinelRef } = useInfiniteScroll({
    hasMore: hasMoreVerifications,
    isLoading: isLoadingMoreVerifications,
    hasError: hasLoadMoreError,
    onLoadMore: onLoadMoreVerifications,
  })

  return (
    <Card>
      <BlockStack gap="400">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <BlockStack gap="050">
            <Text variant={isRTL ? 'headingMd' : 'headingSm'} as="h2">
              {messages.title}
            </Text>
            <Text variant={isRTL ? 'bodySm' : 'bodyXs'} tone="subdued" as="p">
              {messages.subtitle}
            </Text>
          </BlockStack>

          <div className="w-full md:hidden">
            <Select
              label={messages.statusFilterLabel}
              options={statusFilters.map((filter) => ({
                label: filter.label,
                value: filter.id,
              }))}
              value={statusFilter}
              onChange={(value) =>
                onStatusFilterChange(value as VerificationStatusFilter)
              }
            />
          </div>

          <div className="hidden md:flex md:flex-wrap md:justify-end md:gap-2">
            {statusFilters.map((filter) => {
              const button = (
                <Button
                  pressed={statusFilter === filter.id}
                  onClick={() => onStatusFilterChange(filter.id)}
                  size="slim"
                  accessibilityLabel={
                    filter.id === 'no_reply'
                      ? `${filter.label}. ${messages.noReplyTooltip}`
                      : filter.label
                  }
                >
                  {filter.label}
                </Button>
              )

              return filter.id === 'no_reply' ? (
                <span
                  key={filter.id}
                  title={messages.noReplyTooltip}
                  className="inline-flex"
                >
                  {button}
                </span>
              ) : (
                <span key={filter.id} className="inline-flex">
                  {button}
                </span>
              )
            })}
          </div>
        </div>

        {isVerificationsLoading ? (
          <VerificationsTableSkeleton />
        ) : hasVerifications ? (
          <BlockStack gap="300">
            {/*
             * The rows scroll, not the page: the list grows as the merchant
             * reaches the end of it, and the filters above and the count below
             * have to stay put while that happens. `tabIndex` is what makes the
             * region scrollable by keyboard as well as by pointer.
             */}
            <div
              ref={rootRef}
              role="region"
              aria-label={messages.title}
              tabIndex={0}
              className="max-h-[60vh] overflow-x-hidden overflow-y-auto overscroll-contain"
            >
              <VerificationsTableEmbedded
                verifications={verifications}
                actingVerificationId={actingVerificationId}
                reportingTimezone={reportingTimezone}
                canRetryVerifications={canRetryVerifications}
                onRetryVerification={onRetryVerification}
                confirmingCancelVerificationId={confirmingCancelVerificationId}
                actionErrors={actionErrors}
                canCancelOrders={canCancelOrders}
                onRequestCancelOrder={onRequestCancelOrder}
                onDismissCancelOrder={onDismissCancelOrder}
                onConfirmCancelOrder={onConfirmCancelOrder}
              />
              {/* Crossing into view is what asks for the next page. */}
              <div ref={sentinelRef} aria-hidden="true" className="h-px" />
              {isLoadingMoreVerifications && (
                <Box padding="300">
                  <Text as="p" variant="bodySm" tone="subdued">
                    {messages.loadingMore}
                  </Text>
                </Box>
              )}
            </div>
            <InlineStack align="space-between" blockAlign="center" gap="300">
              <Text as="p" variant="bodySm" tone="subdued">
                {messages.showing}
              </Text>
              {/*
               * The only button left: scrolling loads the next page on its own,
               * but a failed page disarms the sentinel, and without this the
               * list would be stranded at whatever it had already loaded.
               */}
              {hasLoadMoreError && (
                <Button onClick={onLoadMoreVerifications}>
                  {messages.loadMoreRetry}
                </Button>
              )}
            </InlineStack>
          </BlockStack>
        ) : shouldShowEmptyState && statusFilter === 'all' ? (
          <DashboardEmptyState
            messages={messages.emptyState}
            showTestSection={canSendTestVerification}
            isSendingTest={isSendingTest}
            onSendTestVerification={onSendTestVerification}
            hasVerifications={hasVerifications}
          />
        ) : (
          <Box padding="400">
            <BlockStack gap="200" inlineAlign="center">
              <Text as="p" tone="subdued" variant="bodySm" alignment="center">
                {messages.emptyMessage}
              </Text>
            </BlockStack>
          </Box>
        )}
      </BlockStack>
    </Card>
  )
}
