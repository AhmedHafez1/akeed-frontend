'use client'

import { useId } from 'react'
import {
  AlertTriangle,
  Clock,
  Moon,
  Package,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type {
  AutomationTimeline,
  TimelineStep,
  TimelineStepId,
} from '@/features/settings/domain/automationTimeline'
import {
  formatQuietTime,
  formatStepDelay,
} from '@/features/settings/skins/shared/settingsFormatters'
import { cn } from '@/shared/lib/utils'
import { akCard, akPill } from '@/shared/ui'

type StepTone = 'neutral' | 'brand' | 'warning'

const STEP_LOOK: Record<
  TimelineStepId,
  { icon: LucideIcon; tone: StepTone; iconClassName?: string }
> = {
  newOrder: { icon: Package, tone: 'neutral' },
  confirmation: {
    icon: Send,
    tone: 'brand',
    iconClassName: 'rtl:-scale-x-100',
  },
  reminder: { icon: Clock, tone: 'brand' },
  needsAction: { icon: AlertTriangle, tone: 'warning' },
}

const MARKER_TONE: Record<StepTone, string> = {
  neutral: 'bg-neutral-soft text-ink-muted',
  // The halo marks the steps where Akeed acts on the order.
  brand: 'bg-brand text-brand-foreground ring-ak-halo ring-4',
  warning: 'bg-ak-warning-soft text-ak-warning ring-ak-warning-line ring-4',
}

/**
 * The line into a step and the wait written on it. Horizontal from 1024px,
 * vertical below, where the wait sits beside the line. Decorative: the step
 * repeats the wait for screen readers.
 */
function Connector({ isOn, label }: { isOn: boolean; label: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative my-1.5 ms-4.75 block h-9 rounded-full lg:my-0 lg:ms-0 lg:mt-4.75 lg:w-auto',
        isOn
          ? 'bg-brand-line w-0.5 lg:h-0.5'
          : 'border-line-strong w-0 border-s-2 border-dashed lg:h-0 lg:border-s-0 lg:border-t-2'
      )}
    >
      <span
        className={cn(
          'border-line bg-surface-raised text-ak-label absolute start-4 top-1/2 -translate-y-1/2 rounded-full border px-2.5 py-0.5 font-semibold whitespace-nowrap lg:start-0 lg:end-0 lg:top-0 lg:mx-auto lg:w-fit',
          isOn ? 'text-ink' : 'text-ink-muted'
        )}
      >
        {label}
      </span>
    </span>
  )
}

function StepNode({
  step,
  title,
  delay,
  offLabel,
}: {
  step: TimelineStep
  title: string
  delay: string | null
  offLabel: string
}) {
  const { icon: Icon, tone, iconClassName } = STEP_LOOK[step.id]
  return (
    <div className="flex items-center gap-3 lg:w-33 lg:flex-col lg:gap-2 lg:text-center">
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full',
          step.isOn
            ? MARKER_TONE[tone]
            : 'border-line-strong bg-surface-sunken text-ink-muted border-[1.5px] border-dashed'
        )}
      >
        <Icon aria-hidden="true" className={cn('size-4.5', iconClassName)} />
      </span>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 lg:flex-col lg:gap-2">
        <span
          className={cn(
            'text-ak-body font-semibold',
            step.isOn ? 'text-ink' : 'text-ink-muted'
          )}
        >
          {title}
        </span>
        {step.isOn ? (
          delay && <span className="sr-only">{delay}</span>
        ) : (
          <span className={akPill({ tone: 'neutral' })}>{offLabel}</span>
        )}
      </span>
    </div>
  )
}

/**
 * "What happens with each COD order": the four steps in order with the wait
 * before each one on the line between them. Built from the form as it stands,
 * so it follows every edit before it is saved. A step that is switched off
 * stays in place, dashed and marked "Off", so the sequence keeps its shape.
 */
export function AutomationFlowCard({
  timeline,
}: {
  timeline: AutomationTimeline
}) {
  const t = useTranslations('settings.embedded.timing')
  const tPage = useTranslations('settings.standalone.page.timing')
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className={akCard}>
      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        <h2 id={headingId} className="text-ak-section text-ink">
          {t('timelineHeading')}
        </h2>
        <p className="text-ak-caption text-ink-muted mt-0.5">
          {tPage('flowDesc')}
        </p>
      </div>

      {/* `role` keeps the list semantics that `list-none` and `contents` drop. */}
      <ol
        role="list"
        className="grid list-none px-4 pt-6 pb-5 sm:px-6 sm:pt-7 sm:pb-6 lg:grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] lg:items-start"
      >
        {timeline.steps.map((step) => {
          const delay = formatStepDelay(t, step)
          return (
            <li key={step.id} role="listitem" className="contents">
              {delay && <Connector isOn={step.isOn} label={delay} />}
              <StepNode
                step={step}
                title={t(`steps.${step.id}`)}
                delay={delay}
                offLabel={t('stepOff')}
              />
            </li>
          )
        })}
      </ol>

      {timeline.quietHours && (
        <p className="border-line bg-surface-sunken text-ak-caption text-ink-muted rounded-b-ak-card flex items-center gap-2 border-t px-4 py-3 sm:px-6">
          <Moon aria-hidden="true" className="size-4 shrink-0" />
          <span>
            {t('quietLine', {
              start: formatQuietTime(t, timeline.quietHours.start),
              end: formatQuietTime(t, timeline.quietHours.end),
            })}
          </span>
        </p>
      )}
    </section>
  )
}
