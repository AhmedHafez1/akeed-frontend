import { Text } from '@shopify/polaris'

interface OnboardingStepCounterProps {
  currentStep: number
  steps: string[]
}

function getStepState(currentStep: number, stepNumber: number) {
  if (stepNumber < currentStep) return 'completed'
  if (stepNumber === currentStep) return 'active'
  return 'pending'
}

export function OnboardingStepCounter({
  currentStep,
  steps,
}: OnboardingStepCounterProps) {
  return (
    <div className="w-full">
      <div className="flex items-start">
        {steps.map((stepLabel, index) => {
          const stepNumber = index + 1
          const state = getStepState(currentStep, stepNumber)
          const isActive = state === 'active'
          const isCompleted = state === 'completed'

          return (
            <div
              key={stepLabel}
              className="flex min-w-0 flex-1 items-start last:flex-none"
            >
              <div className="flex min-w-0 flex-col items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                    isActive || isCompleted
                      ? 'border-[#008060] bg-[#008060] text-white'
                      : 'border-[#c9cccf] bg-white text-[#6d7175]'
                  }`}
                >
                  {stepNumber}
                </span>
                <Text
                  as="span"
                  variant="bodySm"
                  fontWeight={isActive ? 'semibold' : 'medium'}
                  tone={isActive || isCompleted ? undefined : 'subdued'}
                  alignment="center"
                >
                  {stepLabel}
                </Text>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-3 mt-3 h-px min-w-8 flex-1 ${
                    isCompleted ? 'bg-[#008060]' : 'bg-[#d9d9d9]'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
