'use client'

import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  ProgressBar,
  Text,
} from '@shopify/polaris'
import { CheckIcon } from '@shopify/polaris-icons'
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

function ChecklistMarker({ isDone }: { isDone: boolean }) {
  return isDone ? (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--p-color-bg-fill-success) text-(--p-color-text-inverse)">
      <Icon source={CheckIcon} tone="inherit" />
    </span>
  ) : (
    <span className="h-7 w-7 shrink-0 rounded-full border-2 border-(--p-color-border)" />
  )
}

/**
 * First-run dashboard: says Akeed is live, shows the three activation
 * milestones (the last one waits for the merchant's business, it is not a
 * task), and the two things a new merchant may want: quiet hours and help.
 */
export function ActivationPanel({
  messages,
  checklist,
  isLive,
  needsPlan,
  quietHoursEnabled,
  onOpenSettings,
  onOpenQuietHours,
  onTryTest,
  onChoosePlan,
  onContactSupport,
}: ActivationPanelProps) {
  const doneCount = checklist.filter((item) => item.isDone).length

  return (
    <BlockStack gap="400">
      {needsPlan ? (
        <Banner
          tone="warning"
          title={messages.needsPlanTitle}
          action={{ content: messages.choosePlan, onAction: onChoosePlan }}
        >
          <p>{messages.needsPlanBody}</p>
        </Banner>
      ) : (
        <Banner
          tone={isLive ? 'success' : 'warning'}
          action={{ content: messages.settings, onAction: onOpenSettings }}
        >
          <p>{isLive ? messages.liveBanner : messages.pausedBanner}</p>
        </Banner>
      )}

      <InlineGrid columns={{ xs: 1, md: ['twoThirds', 'oneThird'] }} gap="400">
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">
                {messages.checklistTitle}
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                {messages.checklistProgress}
              </Text>
            </InlineStack>
            <ProgressBar
              progress={(doneCount / checklist.length) * 100}
              tone="success"
              size="small"
            />
            <ol className="flex flex-col divide-y divide-(--p-color-border-secondary)">
              {checklist.map((item) => {
                const copy = messages.checklistItems[item.id]
                return (
                  <li key={item.id} className="py-3">
                    <InlineStack
                      align="space-between"
                      blockAlign="center"
                      gap="300"
                      wrap={false}
                    >
                      <InlineStack gap="300" blockAlign="start" wrap={false}>
                        <ChecklistMarker isDone={item.isDone} />
                        <BlockStack gap="050">
                          <Text
                            as="span"
                            variant="bodyMd"
                            fontWeight={item.isDone ? 'regular' : 'semibold'}
                            tone={item.isDone ? 'subdued' : undefined}
                          >
                            {copy.title}
                          </Text>
                          {!item.isDone && copy.hint && (
                            <Text as="span" variant="bodySm" tone="subdued">
                              {copy.hint}
                            </Text>
                          )}
                        </BlockStack>
                      </InlineStack>
                      {item.id === 'test' && !item.isDone && (
                        <Button size="slim" onClick={onTryTest}>
                          {messages.tryTest}
                        </Button>
                      )}
                    </InlineStack>
                  </li>
                )
              })}
            </ol>
          </BlockStack>
        </Card>

        <BlockStack gap="400">
          <Box
            padding="400"
            borderRadius="300"
            borderWidth="025"
            borderColor={quietHoursEnabled ? 'border-caution' : 'border'}
            background={quietHoursEnabled ? 'bg-surface-caution' : 'bg-surface'}
          >
            <BlockStack gap="200">
              <Text as="h2" variant="headingSm">
                {messages.quietHoursTitle}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {messages.quietHoursBody}
              </Text>
              <div>
                <Button variant="plain" onClick={onOpenQuietHours}>
                  {messages.quietHoursAction}
                </Button>
              </div>
            </BlockStack>
          </Box>

          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">
                {messages.helpTitle}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {messages.helpBody}
              </Text>
              <Button fullWidth onClick={onContactSupport}>
                {messages.helpAction}
              </Button>
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>
    </BlockStack>
  )
}
