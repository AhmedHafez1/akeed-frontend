'use client'

import { BlockStack, Box, Card, Icon, Text } from '@shopify/polaris'
import {
  ClockIcon,
  PackageIcon,
  PersonIcon,
  SendIcon,
} from '@shopify/polaris-icons'
import type { IconSource } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type {
  AutomationTimeline,
  TimelineStep,
  TimelineStepId,
} from '@/features/settings/domain/automationTimeline'
import {
  formatConnectorDelay,
  formatQuietTime,
} from '@/features/settings/skins/shared/settingsFormatters'
import { cn } from '@/shared/lib/utils'

const STEP_ICON: Record<TimelineStepId, IconSource> = {
  newOrder: PackageIcon,
  confirmation: SendIcon,
  reminder: ClockIcon,
  needsAction: PersonIcon,
}

const LINE = 'border-(--p-color-border-tertiary)'

function markerClassName(step: TimelineStep) {
  if (!step.isOn) {
    return cn(
      LINE,
      'border-[1.5px] border-dashed text-(--p-color-icon-secondary)'
    )
  }
  // The order arriving is not something Akeed does, so it stays neutral.
  return step.id === 'newOrder'
    ? 'bg-(--p-color-bg-fill-secondary) text-(--p-color-icon-secondary)'
    : 'bg-(--p-color-bg-fill-brand) text-(--p-color-text-brand-on-bg-fill)'
}

/**
 * The line into a step, its arrowhead and the wait written on it. Horizontal
 * from 640px; below that it runs down with the wait beside it. Decorative: the
 * step repeats the wait for screen readers.
 */
function Connector({ isOn, label }: { isOn: boolean; label: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative ms-4.25 block h-11 w-0 sm:mx-1.5 sm:ms-1.5 sm:h-9 sm:w-auto sm:min-w-10"
    >
      <span
        className={cn(
          LINE,
          'absolute inset-y-1 start-0 border-s-2 sm:inset-x-0 sm:inset-y-auto sm:top-1/2 sm:-translate-y-1/2 sm:border-s-0 sm:border-t-2',
          !isOn && 'border-dashed'
        )}
      />
      <span
        className={cn(
          LINE,
          'absolute start-0 bottom-1 size-2 -translate-x-[3px] rotate-45 border-e-2 border-b-2 sm:start-auto sm:end-0 sm:top-1/2 sm:bottom-auto sm:translate-x-0 sm:-translate-y-1/2 sm:border-t-2 sm:border-b-0 rtl:translate-x-[3px] rtl:-rotate-45 sm:rtl:translate-x-0'
        )}
      />
      <span className="absolute start-5 top-1/2 flex -translate-y-1/2 sm:inset-x-0 sm:justify-center">
        <span className="shrink-0 rounded-full border border-(--p-color-border) bg-(--p-color-bg-surface) px-2 py-0.5 whitespace-nowrap">
          <Text
            as="span"
            variant="bodySm"
            fontWeight="medium"
            tone={isOn ? undefined : 'subdued'}
          >
            {label}
          </Text>
        </span>
      </span>
    </span>
  )
}

function StepNode({
  step,
  title,
  delay,
}: {
  step: TimelineStep
  title: string
  delay: string | null
}) {
  return (
    <div className="flex items-center gap-3 sm:w-28 sm:flex-col sm:gap-2 sm:text-center">
      <span
        data-step-state={step.isOn ? 'on' : 'off'}
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full',
          markerClassName(step)
        )}
      >
        <span
          className={
            step.id === 'confirmation' ? 'rtl:-scale-x-100' : undefined
          }
        >
          <Icon source={STEP_ICON[step.id]} tone="inherit" />
        </span>
      </span>
      <Text
        as="span"
        fontWeight="semibold"
        tone={step.isOn ? undefined : 'subdued'}
      >
        {title}
        {delay && <span className="sr-only"> {delay}</span>}
      </Text>
    </div>
  )
}

/**
 * "What happens with each COD order": the four steps in order with the wait
 * before each one on the line between them. Computed from the current form
 * values, so it reflects unsaved edits. A step that is switched off stays in
 * place, dashed and marked "Off", so the sequence keeps its shape.
 */
export function AutomationTimelineCard({
  timeline,
}: {
  timeline: AutomationTimeline
}) {
  const t = useTranslations('settings.embedded.timing')

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          {t('timelineHeading')}
        </Text>
        {/* `role` keeps the list semantics that `list-none` and `contents` drop. */}
        <ol
          role="list"
          className="m-0 grid list-none p-0 sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:items-start"
        >
          {timeline.steps.map((step) => {
            const delay = formatConnectorDelay(t, step)
            return (
              <li key={step.id} role="listitem" className="contents">
                {delay && <Connector isOn={step.isOn} label={delay} />}
                <StepNode
                  step={step}
                  title={t(`steps.${step.id}`)}
                  delay={delay}
                />
              </li>
            )
          })}
        </ol>
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
