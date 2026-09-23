import { Icon, Text } from '@shopify/polaris'
import { CheckIcon } from '@shopify/polaris-icons'

interface OnboardingStepCounterProps {
  /** Zero-based index of the step being worked on. */
  currentIndex: number
  steps: ReadonlyArray<string>
}

type StepState = 'completed' | 'active' | 'pending'

function getStepState(currentIndex: number, index: number): StepState {
  if (index < currentIndex) return 'completed'
  if (index === currentIndex) return 'active'
  return 'pending'
}

const MARKER_CLASS: Record<StepState, string> = {
  completed:
    'border-(--p-color-bg-fill-success) bg-(--p-color-bg-fill-success) text-(--p-color-text-inverse)',
  active:
    'border-(--p-color-bg-fill-success) bg-(--p-color-bg-fill-success) text-(--p-color-text-inverse)',
  pending:
    'border-(--p-color-border) bg-(--p-color-bg-surface) text-(--p-color-text-secondary)',
}

export function OnboardingStepCounter({
  currentIndex,
  steps,
}: OnboardingStepCounterProps) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((stepLabel, index) => {
        const state = getStepState(currentIndex, index)
        const isLast = index === steps.length - 1

        return (
          <li
            key={stepLabel}
            aria-current={state === 'active' ? 'step' : undefined}
            className={`flex min-w-0 items-center ${isLast ? '' : 'flex-1'}`}
          >
            <span className="flex shrink-0 items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${MARKER_CLASS[state]}`}
              >
                {state === 'completed' ? (
                  <Icon source={CheckIcon} tone="inherit" />
                ) : (
                  index + 1
                )}
              </span>
              <Text
                as="span"
                variant="bodyMd"
                fontWeight={state === 'active' ? 'semibold' : 'regular'}
                tone={state === 'pending' ? 'subdued' : undefined}
              >
                {stepLabel}
              </Text>
            </span>

            {!isLast && (
              <span
                aria-hidden
                className={`mx-3 h-0.5 min-w-8 flex-1 rounded-full ${
                  state === 'completed'
                    ? 'bg-(--p-color-bg-fill-success)'
                    : 'bg-(--p-color-border)'
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
