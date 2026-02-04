import { OnboardingStep, OnboardingStepMeta } from '@/types/onboarding.model'

interface OnboardingProgressProps {
  steps: OnboardingStepMeta[]
  currentStep: OnboardingStep
}

export function OnboardingProgress({
  steps,
  currentStep,
}: OnboardingProgressProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex flex-wrap items-center justify-center gap-4">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                steps.findIndex((item) => item.id === currentStep) >= index
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {index + 1}
            </div>
            <span className="text-sm font-medium text-slate-700">
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
