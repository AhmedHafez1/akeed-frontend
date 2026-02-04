'use client'

import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingActions } from './OnboardingActions'
import { OnboardingError } from './OnboardingError'
import { OnboardingHeader } from './OnboardingHeader'
import { OnboardingProgress } from './OnboardingProgress'
import { OrganizationStep } from './steps/OrganizationStep'
import { PlatformStep } from './steps/PlatformStep'
import { WhatsappStep } from './steps/WhatsappStep'
import { CompleteStep } from './steps/CompleteStep'

export function OnboardingContainer() {
  const {
    t,
    steps,
    currentStep,
    isLoading,
    error,
    formData,
    handleChange,
    handlePlatformToggle,
    handleNext,
    handleSkip,
  } = useOnboarding()

  return (
    <div className="space-y-8">
      <OnboardingHeader
        title={t('onboarding.welcomeToAkeed')}
        subtitle={t('onboarding.letsSetupAccount')}
      />

      {currentStep !== 'complete' && (
        <OnboardingProgress steps={steps} currentStep={currentStep} />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        {error ? <OnboardingError message={error} /> : null}

        {currentStep === 'organization' && (
          <OrganizationStep t={t} formData={formData} onChange={handleChange} />
        )}

        {currentStep === 'platform' && (
          <PlatformStep
            t={t}
            selectedPlatforms={formData.selectedPlatforms}
            onToggle={handlePlatformToggle}
          />
        )}

        {currentStep === 'whatsapp' && (
          <WhatsappStep t={t} formData={formData} onChange={handleChange} />
        )}

        {currentStep === 'complete' && <CompleteStep t={t} />}

        <OnboardingActions
          currentStep={currentStep}
          isLoading={isLoading}
          onNext={handleNext}
          onSkip={handleSkip}
          t={t}
        />
      </div>
    </div>
  )
}
