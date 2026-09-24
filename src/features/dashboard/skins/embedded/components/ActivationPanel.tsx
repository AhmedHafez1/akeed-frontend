'use client'

import {
  Banner,
  BlockStack,
  Button,
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
  onOpenQuietHours: () => void
  onTryTest: () => void
  onChoosePlan: () => void
  onContactSupport: () => void
}


/**
 * First-run dashboard: says Akeed is live, shows the three activation
 * milestones (the last one waits for the merchant's business, it is not a
 * task), and the two things a new merchant may want: quiet hours and help.
 */
export function ActivationPanel({
  messages,
  isLive,
  needsPlan,
  onOpenSettings,
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
          <InlineStack
            align="space-between"
            blockAlign="center"
            gap="300"
            wrap={false}
            
          >
            <div className="min-w-0 flex-1">
              <p>{isLive ? messages.liveBanner : messages.pausedBanner}</p>
            </div>
            <Button onClick={onOpenSettings}>{messages.settings}</Button>
          </InlineStack>
        </Banner>
      )}
    </BlockStack>
  )
}
