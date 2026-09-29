import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type StepperStepState = 'done' | 'current' | 'upcoming'

export interface StepperStep {
  id: string
  title: ReactNode
  state: StepperStepState
}

interface StepperProps {
  steps: readonly StepperStep[]
  /** Accessible name of the list, e.g. "Setup progress". */
  label: string
  /** Screen-reader text after a completed step's title. */
  completedLabel: string
  className?: string
}

/**
 * The design-system progress stepper: numbered discs joined by a connector,
 * a check once a step is done and a soft halo on the current one. It only
 * reports progress; steps are never clickable. Steps render in DOM order, so
 * the first step sits on the inline start edge in both directions.
 */
export function Stepper({
  steps,
  label,
  completedLabel,
  className,
}: StepperProps) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex items-center gap-3">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          return (
            <li
              key={step.id}
              aria-current={step.state === 'current' ? 'step' : undefined}
              className="flex items-center gap-3"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                    step.state === 'upcoming'
                      ? 'border-line-strong text-ink-muted border-2'
                      : 'bg-primary text-primary-foreground',
                    step.state === 'current' && 'ring-brand-soft ring-4'
                  )}
                >
                  {step.state === 'done' ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm whitespace-nowrap',
                    step.state === 'current'
                      ? 'text-brand-ink font-semibold'
                      : step.state === 'done'
                        ? 'text-ink font-medium'
                        : 'text-ink-muted'
                  )}
                >
                  {step.title}
                  {step.state === 'done' && (
                    <span className="sr-only"> ({completedLabel})</span>
                  )}
                </span>
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-0.5 w-8 rounded-full',
                    step.state === 'done' ? 'bg-primary' : 'bg-line-strong'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

interface StepperCompactProps {
  /** "3 of 3 · Try the message", already localized. */
  progressLabel: string
  /** 0–1, the share of the bar that is filled. */
  progress: number
  className?: string
}

/**
 * The phone-width form of the stepper: one line of text plus a 3px bar,
 * used where the full stepper would not fit.
 */
export function StepperCompact({
  progressLabel,
  progress,
  className,
}: StepperCompactProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100)
  return (
    <p className={cn('text-ink-muted text-sm tabular-nums', className)}>
      {progressLabel}
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={progressLabel}
        className="bg-line absolute inset-x-0 bottom-0 block h-[3px]"
      >
        <span
          className="bg-primary block h-full transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </span>
    </p>
  )
}
