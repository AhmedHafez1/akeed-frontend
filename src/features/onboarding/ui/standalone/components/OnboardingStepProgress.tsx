'use client'

import { useTranslations } from 'next-intl'
import type { StandaloneStep } from '@/features/onboarding/domain/onboarding.types'
import {
  STANDALONE_STEPS,
  STANDALONE_TOTAL_STEPS,
} from '@/features/onboarding/model/onboarding.steps'
import { cn } from '@/shared/lib/utils'

interface OnboardingStepProgressProps {
  currentStep: StandaloneStep
  completedSteps: ReadonlySet<StandaloneStep>
}

/** Compact indicator used below the tablet breakpoint in place of the rail. */
export function OnboardingStepProgress({
  currentStep,
  completedSteps,
}: OnboardingStepProgressProps) {
  const t = useTranslations('standaloneOnboarding')
  const definition = STANDALONE_STEPS.find((step) => step.id === currentStep)

  return (
    <div
      aria-label={t('steps.label')}
      className="rounded-xl border border-slate-200 bg-white p-4 text-start md:hidden"
    >
      <p className="text-xs font-medium text-slate-500 tabular-nums">
        {t('steps.progress', {
          current: currentStep,
          total: STANDALONE_TOTAL_STEPS,
        })}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">
        {definition ? t(definition.titleKey) : null}
      </p>
      <div aria-hidden="true" className="mt-3 flex gap-1.5">
        {STANDALONE_STEPS.map((step) => (
          <span
            key={step.id}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              step.id === currentStep
                ? 'bg-emerald-600'
                : completedSteps.has(step.id)
                  ? 'bg-emerald-300'
                  : 'bg-slate-200'
            )}
          />
        ))}
      </div>
    </div>
  )
}
