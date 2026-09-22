'use client'

import { useTranslations } from 'next-intl'
import type { StandaloneStep } from '@/features/onboarding/domain/onboarding.types'
import {
  STANDALONE_STEPS,
  STANDALONE_TOTAL_STEPS,
} from '@/features/onboarding/model/onboarding.steps'
import { StepProgress } from '@/shared/ui/stepper'

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

  return (
    <StepProgress
      steps={STANDALONE_STEPS.map((definition) => ({
        id: definition.id,
        marker: definition.id,
        title: t(definition.titleKey),
      }))}
      currentStep={currentStep}
      completedSteps={completedSteps}
      label={t('steps.label')}
      progressLabel={t('steps.progress', {
        current: currentStep,
        total: STANDALONE_TOTAL_STEPS,
      })}
    />
  )
}
