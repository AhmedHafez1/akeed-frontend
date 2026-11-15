'use client'

import {
  Banner,
  BlockStack,
  Button,
  InlineGrid,
  InlineStack,
} from '@shopify/polaris'
import type {
  ChecklistItem,
  ChecklistItemId,
} from '@/features/dashboard/model/activation.model'

export interface ActivationPanelMessages {
  liveBanner: string
  pausedBanner: string
  needsPlanTitle: string
  needsPlanBody: string
  choosePlan: string
  settings: string
  dismiss: string
  checklistTitle: string
  checklistProgress: string
  checklistItems: Record<ChecklistItemId, { title: string; hint?: string }>
  tryTest: string
  quietHoursTitle: string
  quietHoursBody: string
  quietHoursAction: string
  helpTitle: string
  helpBody: string
  helpAction: string
}

interface ActivationPanelProps {
  messages: ActivationPanelMessages
  checklist: ReadonlyArray<ChecklistItem>
  isLive: boolean
  needsPlan: boolean
  quietHoursEnabled: boolean
  onOpenSettings: () => void
  onDismissLive: () => void
  onOpenQuietHours: () => void
  onTryTest: () => void
  onChoosePlan: () => void
  onContactSupport: () => void
}

/**
 * Dismissible welcome status, or an independent warning when automation is paused.
 */
export function ActivationPanel({
  messages,
  isLive,
  needsPlan,
  onOpenSettings,
  onDismissLive,
  onChoosePlan,
}: ActivationPanelProps) {
  return (
    <BlockStack gap="400">
      {needsPlan ? (
        <Banner tone="warning" title={messages.needsPlanTitle}>
          <InlineStack
            align="space-between"
            blockAlign="center"
            gap="300"
            wrap={false}
          >
            <div className="min-w-0 flex-1">
              <p>{messages.needsPlanBody}</p>
            </div>
            <Button onClick={onChoosePlan}>{messages.choosePlan}</Button>
          </InlineStack>
        </Banner>
      ) : (
        <Banner tone={isLive ? 'success' : 'warning'}>
          <InlineGrid
            columns={{ xs: '1fr', sm: '1fr auto' }}
            alignItems="center"
            gap="300"
          >
            <div className="min-w-0">
              <p>{isLive ? messages.liveBanner : messages.pausedBanner}</p>
            </div>
            <InlineStack gap="300" blockAlign="center" align="end" wrap={false}>
              <Button onClick={onOpenSettings}>{messages.settings}</Button>
              {isLive && (
                <Button variant="tertiary" onClick={onDismissLive}>
                  {messages.dismiss}
                </Button>
              )}
            </InlineStack>
          </InlineGrid>
        </Banner>
      )}
    </BlockStack>
  )
}
