'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface StepDefinition<Id extends string | number> {
  id: Id
  /** Shown in the step circle while the step is not completed. */
  marker: ReactNode
  title: ReactNode
  description?: ReactNode
}

interface StepRailProps<Id extends string | number> {
  steps: readonly StepDefinition<Id>[]
  currentStep: Id
  completedSteps: ReadonlySet<Id>
  /** Accessible name of the rail; the vertical rail also shows it as a heading. */
  label: string
  /** Screen-reader text after a completed step's title. */
  completedLabel: string
  canGoToStep?: (step: Id) => boolean
  onSelectStep?: (step: Id) => void
  footer?: ReactNode
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

const circleClasses = (isCompleted: boolean, isCurrent: boolean) =>
  cn(
    'relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums',
    isCompleted || isCurrent
      ? 'bg-primary text-primary-foreground border-primary'
      : 'border-border bg-card text-muted-foreground'
  )

/**
 * Step rail shown from the tablet breakpoint up. Vertical is the onboarding
 * side rail; horizontal is a top rail. Steps render in DOM order, so the
 * first step sits on the inline start edge in both directions.
 */
export function StepRail<Id extends string | number>({
  steps,
  currentStep,
  completedSteps,
  label,
  completedLabel,
  canGoToStep = () => false,
  onSelectStep,
  footer,
  orientation = 'vertical',
  className,
}: StepRailProps<Id>) {
  const horizontal = orientation === 'horizontal'

  return (
    <nav
      aria-label={label}
      className={cn(
        'rounded-card border-border bg-card hidden border text-start md:block',
        horizontal ? 'px-5 py-4' : 'p-5',
        className
      )}
    >
      {!horizontal && (
        <h2 className="text-foreground text-sm font-semibold">{label}</h2>
      )}
      <ol
        className={cn(
          horizontal ? 'flex items-center gap-3' : 'mt-5 space-y-6'
        )}
      >
        {steps.map((definition, index) => {
          const isCompleted = completedSteps.has(definition.id)
          const isCurrent = definition.id === currentStep
          const isSelectable = canGoToStep(definition.id) && !isCurrent
          const isLast = index === steps.length - 1

          return (
            <li
              key={definition.id}
              className={cn(
                'relative',
                horizontal && 'flex min-w-0 flex-1 items-center gap-3'
              )}
            >
              {!isLast && !horizontal && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute start-5.75 top-11 bottom-2 h-10 w-0.5 rounded-full',
                    isCompleted ? 'bg-primary' : 'bg-input'
                  )}
                />
              )}
              <button
                type="button"
                disabled={!isSelectable}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelectStep?.(definition.id)}
                className={cn(
                  'focus-visible:ring-ring flex items-start gap-3 rounded-lg p-2 text-start transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  horizontal ? 'min-w-0 shrink-0 items-center' : 'w-full',
                  isSelectable
                    ? 'hover:bg-muted/50 cursor-pointer'
                    : 'cursor-default'
                )}
              >
                <span
                  aria-hidden="true"
                  className={circleClasses(isCompleted, isCurrent)}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    definition.marker
                  )}
                </span>
                <span className={cn('min-w-0', !horizontal && 'pt-0.5')}>
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      isCurrent ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {definition.title}
                  </span>
                  {definition.description && (
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {definition.description}
                    </span>
                  )}
                  {isCompleted && !isCurrent && (
                    <span className="sr-only">{completedLabel}</span>
                  )}
                </span>
              </button>
              {!isLast && horizontal && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-0.5 min-w-6 flex-1 rounded-full',
                    isCompleted ? 'bg-primary' : 'bg-input'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
      {footer}
    </nav>
  )
}

interface StepProgressProps<Id extends string | number> {
  steps: readonly StepDefinition<Id>[]
  currentStep: Id
  completedSteps: ReadonlySet<Id>
  label: string
  /** "Step 2 of 3", already localized. */
  progressLabel: string
  className?: string
}

/** Compact indicator used below the tablet breakpoint in place of the rail. */
export function StepProgress<Id extends string | number>({
  steps,
  currentStep,
  completedSteps,
  label,
  progressLabel,
  className,
}: StepProgressProps<Id>) {
  const definition = steps.find((step) => step.id === currentStep)

  return (
    <div
      aria-label={label}
      className={cn(
        'rounded-card border-border bg-card border p-4 text-start md:hidden',
        className
      )}
    >
      <p className="text-muted-foreground text-xs font-medium tabular-nums">
        {progressLabel}
      </p>
      <p className="text-foreground mt-1 text-sm font-semibold">
        {definition?.title ?? null}
      </p>
      <div aria-hidden="true" className="mt-3 flex gap-1.5">
        {steps.map((step) => (
          <span
            key={step.id}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              step.id === currentStep
                ? 'bg-primary'
                : completedSteps.has(step.id)
                  ? 'bg-primary-border'
                  : 'bg-border'
            )}
          />
        ))}
      </div>
    </div>
  )
}
