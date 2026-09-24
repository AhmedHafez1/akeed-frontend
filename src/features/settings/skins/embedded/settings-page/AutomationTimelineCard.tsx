'use client'

import {
  BlockStack,
  Box,
  Card,
  Icon,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { AlertTriangleIcon, OrderIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import type {
  AutomationTimeline,
  TimelineStep,
} from '@/features/settings/domain/automationTimeline'
import { formatDuration, formatQuietTime } from './settingsFormatters'

function StepMarker({ step, index }: { step: TimelineStep; index: number }) {
  if (step.id === 'newOrder') {
    return (
      <Box background="bg-fill-secondary" borderRadius="full" padding="200">
        <Icon source={OrderIcon} tone="subdued" />
      </Box>
    )
  }
  if (step.id === 'needsAction') {
    return (
      <Box
        background={step.isOn ? 'bg-fill-caution' : 'bg-fill-disabled'}
        borderRadius="full"
        padding="200"
      >
        <Icon
          source={AlertTriangleIcon}
          tone={step.isOn ? 'caution' : 'subdued'}
        />
      </Box>
    )
  }
  return (
    <Box
      background={step.isOn ? 'bg-fill-inverse' : 'bg-fill-disabled'}
      borderRadius="full"
      minWidth="36px"
      minHeight="36px"
      padding="200"
    >
      <Text
        as="span"
        alignment="center"
        fontWeight="bold"
        tone={step.isOn ? 'text-inverse' : 'disabled'}
      >
        {index}
      </Text>
    </Box>
  )
}

/**
 * "What happens with each COD order", computed from the current form values
 * so it reflects unsaved edits. Steps that are switched off stay in place and
 * read "Off", so the sequence keeps its shape.
 */
export function AutomationTimelineCard({
  timeline,
}: {
  timeline: AutomationTimeline
}) {
  const t = useTranslations('settings.embedded.timing')

  const delayText = (step: TimelineStep): string | null => {
    if (!step.isOn) return t('stepOff')
    switch (step.delay.kind) {
      case 'none':
        return null
      case 'immediate':
        return t('delayImmediate')
      case 'after': {
        const duration = formatDuration(t, step.delay.minutes)
        return step.delay.relativeTo === 'reminder'
          ? t('delayAfterMore', { duration })
          : t('delayAfter', { duration })
      }
    }
  }

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          {t('timelineHeading')}
        </Text>
        <InlineStack as="ol" align="space-around" gap="400">
          {timeline.steps.map((step, index) => {
            const delay = delayText(step)
            return (
              <BlockStack as="li" key={step.id} gap="200" inlineAlign="center">
                <StepMarker step={step} index={index} />
                <Text
                  as="p"
                  alignment="center"
                  fontWeight="semibold"
                  tone={step.isOn ? undefined : 'subdued'}
                >
                  {t(`steps.${step.id}`)}
                </Text>
                {delay && (
                  <Text as="p" alignment="center" tone="subdued">
                    {delay}
                  </Text>
                )}
              </BlockStack>
            )
          })}
        </InlineStack>
        {timeline.quietHours && (
          <Box
            background="bg-surface-secondary"
            borderRadius="200"
            padding="300"
          >
            <Text as="p" tone="subdued">
              {t('quietLine', {
                start: formatQuietTime(t, timeline.quietHours.start),
                end: formatQuietTime(t, timeline.quietHours.end),
              })}
            </Text>
          </Box>
        )}
      </BlockStack>
    </Card>
  )
}
