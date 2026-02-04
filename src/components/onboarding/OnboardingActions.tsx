import { OnboardingStep } from '@/types/onboarding.model'

interface OnboardingActionsProps {
  currentStep: OnboardingStep
  isLoading: boolean
  onNext: () => void
  onSkip: () => void
  t: (key: string) => string
}

export function OnboardingActions({
  currentStep,
  isLoading,
  onNext,
  onSkip,
  t,
}: OnboardingActionsProps) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      {currentStep === 'whatsapp' && (
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          {t('onboarding.skipForNow')}
        </button>
      )}
      <div className="flex-1" />
      <button
        type="button"
        onClick={onNext}
        disabled={isLoading}
        className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
      >
        {isLoading
          ? t('onboarding.processing')
          : currentStep === 'complete'
            ? t('onboarding.gotoDashboard')
            : t('onboarding.continue')}
      </button>
    </div>
  )
}
