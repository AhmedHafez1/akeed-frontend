'use client'

import { ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { StandaloneStep } from '@/features/onboarding/domain/onboarding.types'
import { STANDALONE_STEPS } from '@/features/onboarding/model/onboarding.steps'
import { StepRail } from '@/shared/ui/stepper'

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
    <StepRail
      steps={STANDALONE_STEPS.map((definition) => ({
        id: definition.id,
        marker: definition.id,
        title: t(definition.titleKey),
        description: t(definition.descriptionKey),
      }))}
      currentStep={currentStep}
      completedSteps={completedSteps}
      canGoToStep={canGoToStep}
      onSelectStep={onSelectStep}
      label={t('steps.label')}
      completedLabel={t('steps.completed')}
      footer={
        <p className="border-border text-muted-foreground mt-6 flex items-start gap-2 border-t pt-4 text-xs leading-5">
          <ShieldCheck
            aria-hidden="true"
            className="text-primary mt-px h-4 w-4 shrink-0"
          />
          {t('editableLater')}
        </p>
      }
    />
  )
}
