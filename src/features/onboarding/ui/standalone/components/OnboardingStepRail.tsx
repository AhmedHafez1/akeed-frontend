'use client'

import { Check, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { StandaloneStep } from '@/features/onboarding/domain/onboarding.types'
import { STANDALONE_STEPS } from '@/features/onboarding/model/onboarding.steps'
import { cn } from '@/shared/lib/utils'

interface OnboardingStepRailProps {
  currentStep: StandaloneStep
  completedSteps: ReadonlySet<StandaloneStep>
  canGoToStep: (step: StandaloneStep) => boolean
  onSelectStep: (step: StandaloneStep) => void
}

/**
 * Desktop progress rail. Rendered first in DOM order so grid flow puts it on
 * the inline start edge — right in Arabic, left in English.
 */
export function OnboardingStepRail({
  currentStep,
  completedSteps,
  canGoToStep,
  onSelectStep,
}: OnboardingStepRailProps) {
  const t = useTranslations('standaloneOnboarding')

  return (
    <nav
      aria-label={t('steps.label')}
      className="hidden rounded-xl border border-slate-200 bg-white p-5 text-start md:block"
    >
      <h2 className="text-sm font-semibold text-slate-950">
        {t('steps.label')}
      </h2>
      <ol className="mt-5 space-y-1">
        {STANDALONE_STEPS.map((definition, index) => {
          const isCompleted = completedSteps.has(definition.id)
          const isCurrent = definition.id === currentStep
          const isSelectable = canGoToStep(definition.id) && !isCurrent
          const isLast = index === STANDALONE_STEPS.length - 1

          return (
            <li key={definition.id} className="relative">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute [inset-inline-start:1rem] top-11 bottom-1 w-px',
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                />
              )}
              <button
                type="button"
                disabled={!isSelectable}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelectStep(definition.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg p-2 text-start transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none',
                  isSelectable
                    ? 'cursor-pointer hover:bg-slate-50'
                    : 'cursor-default'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums',
                    isCompleted
                      ? 'bg-primary text-primary-foreground border-emerald-600'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground border-emerald-600'
                        : 'border-slate-200 bg-white text-slate-500'
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    definition.id
                  )}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      isCurrent ? 'text-emerald-700' : 'text-slate-900'
                    )}
                  >
                    {t(definition.titleKey)}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {t(definition.descriptionKey)}
                  </span>
                  {isCompleted && !isCurrent && (
                    <span className="sr-only">{t('steps.completed')}</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="mt-6 flex items-start gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
        <ShieldCheck
          aria-hidden="true"
          className="text-primary mt-px h-4 w-4 shrink-0"
        />
        {t('editableLater')}
      </p>
    </nav>
  )
}
