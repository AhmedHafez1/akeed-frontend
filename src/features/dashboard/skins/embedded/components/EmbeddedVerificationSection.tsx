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
  loadingMore: string
  loadMore: string
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
  hasVerifications: boolean
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

export function EmbeddedVerificationSection({
  messages,
  verifications,
  isVerificationsLoading,
  hasMoreVerifications,
  isLoadingMoreVerifications,
  hasVerifications,
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
}: EmbeddedVerificationSectionProps) {
  const { isRTL } = useLocaleInfo()
  const shouldShowEmptyState = !hasVerifications

  return (
    <Card>
      <BlockStack gap="400">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <BlockStack gap="050">
            <Text variant={isRTL ? 'headingMd' : 'headingSm'} as="h2">
              {messages.title}
            </Text>
            <Text
              variant={isRTL ? 'bodySm' : 'bodyXs'}
              tone="subdued"
              as="p"
            >
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
            {statusFilters.map((filter) => (
              <Button
                key={filter.id}
                pressed={statusFilter === filter.id}
                onClick={() => onStatusFilterChange(filter.id)}
                size="slim"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {isVerificationsLoading ? (
          <VerificationsTableSkeleton />
        ) : hasVerifications ? (
          <BlockStack gap="300">
            <VerificationsTableEmbedded
              verifications={verifications}
              cancelingVerificationId={cancelingVerificationId}
              confirmingCancelVerificationId={confirmingCancelVerificationId}
              cancelOrderErrors={cancelOrderErrors}
              onRequestCancelOrder={onRequestCancelOrder}
              onDismissCancelOrder={onDismissCancelOrder}
              onConfirmCancelOrder={onConfirmCancelOrder}
            />
            {hasMoreVerifications && (
              <InlineStack align="center">
                <Button
                  onClick={onLoadMoreVerifications}
                  loading={isLoadingMoreVerifications}
                >
                  {isLoadingMoreVerifications
                    ? messages.loadingMore
                    : messages.loadMore}
                </Button>
              </InlineStack>
            )}
          </BlockStack>
        ) : shouldShowEmptyState && statusFilter === 'all' ? (
          <DashboardEmptyState
            messages={messages.emptyState}
            showTestSection
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
