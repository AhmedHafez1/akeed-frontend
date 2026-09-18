'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import type {
  StandaloneSetupFieldKey,
  StandaloneStep,
} from '@/features/onboarding/domain/onboarding.types'
import { useStandaloneOnboarding } from '@/features/onboarding/hooks/useStandaloneOnboarding'
import {
  getStepDefinition,
  STANDALONE_FIELD_IDS,
  STANDALONE_TOTAL_STEPS,
} from '@/features/onboarding/model/onboarding.steps'
import { Button, Card } from '@/shared/ui'
import {
  OnboardingCardSkeleton,
  OnboardingStepProgress,
  OnboardingStepRail,
} from './components'
import { ConfirmationRulesStep } from './steps/ConfirmationRulesStep'
import { ReviewStep } from './steps/ReviewStep'
import { StoreDetailsStep } from './steps/StoreDetailsStep'

function focusField(field: StandaloneSetupFieldKey) {
  const element = document.getElementById(STANDALONE_FIELD_IDS[field])
  if (element instanceof HTMLElement) {
    element.focus()
    element.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

export function StandaloneOnboardingPage() {
  const t = useTranslations('standaloneOnboarding')
  const onboarding = useStandaloneOnboarding()
  const [currentStep, setCurrentStep] = useState<StandaloneStep>(1)
  const [completedSteps, setCompletedSteps] = useState<Set<StandaloneStep>>(
    () => new Set()
  )
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hasMountedRef = useRef(false)
  /** Field to focus once the step that owns it has rendered. */
  const pendingFocusRef = useRef<StandaloneSetupFieldKey | null>(null)

  const { canManage, isSaving, isCompleting, resetSuccess } = onboarding
  const isBusy = isSaving || isCompleting

  // Move focus to the step heading on every step change except the first
  // render, so screen-reader users land at the top of the new step.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    headingRef.current?.focus()
  }, [currentStep])

  // Focus the offending control only after its step has mounted.
  useEffect(() => {
    const field = pendingFocusRef.current
    if (!field) return
    pendingFocusRef.current = null
    focusField(field)
  }, [currentStep, onboarding.fieldErrors])

  const canGoToStep = useCallback(
    (step: StandaloneStep) => {
      if (!canManage) return true
      return (
        step <= currentStep || completedSteps.has((step - 1) as StandaloneStep)
      )
    },
    [canManage, completedSteps, currentStep]
  )

  const goToStep = useCallback(
    (step: StandaloneStep) => {
      if (!canGoToStep(step)) return
      resetSuccess()
      setCurrentStep(step)
    },
    [canGoToStep, resetSuccess]
  )

  const markCompleted = useCallback((step: StandaloneStep) => {
    setCompletedSteps((current) => new Set(current).add(step))
  }, [])

  const handleSaveProgress = useCallback(async () => {
    const result = await onboarding.save()
    if (result.state) return
    if (result.firstInvalidField && result.errorStep) {
      pendingFocusRef.current = result.firstInvalidField
      setCurrentStep(result.errorStep)
    }
  }, [onboarding])

  const handlePrimary = useCallback(async () => {
    // Read-only users may walk the wizard, but nothing is sent or persisted.
    if (!canManage) {
      if (currentStep < STANDALONE_TOTAL_STEPS) {
        setCurrentStep((step) => (step + 1) as StandaloneStep)
      }
      return
    }

    if (currentStep === 3) {
      const completion = await onboarding.complete()
      // Completion saves first; if that save is rejected by a field owned by
      // an earlier step, take the user to it instead of stalling on step 3.
      if (completion.firstInvalidField && completion.errorStep) {
        pendingFocusRef.current = completion.firstInvalidField
        setCurrentStep(completion.errorStep)
      }
      return
    }

    const stepCheck = onboarding.validateStep(currentStep)
    if (!stepCheck.ok) {
      if (stepCheck.firstInvalidField) focusField(stepCheck.firstInvalidField)
      return
    }

    const result = await onboarding.save()
    if (!result.state) {
      // A full-payload failure can belong to another step — go there rather
      // than blocking the user behind an error they cannot see.
      if (result.firstInvalidField && result.errorStep) {
        pendingFocusRef.current = result.firstInvalidField
        setCurrentStep(result.errorStep)
      }
      return
    }

    markCompleted(currentStep)
    setCurrentStep((step) => (step + 1) as StandaloneStep)
  }, [canManage, currentStep, markCompleted, onboarding])

  if (onboarding.isLoading) return <OnboardingCardSkeleton />

  if (!onboarding.state) {
    const code = onboarding.loadErrorCode ?? 'UNAVAILABLE'
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4">
        <Card className="border-destructive-border w-full p-6 text-center">
          <h1 className="text-foreground text-xl font-bold">
            {t('loadErrorTitle')}
          </h1>
          <p className="text-foreground/70 mt-2 text-sm">
            {code === 'ONBOARDING_SOURCE_MISSING'
              ? t('sourceMissing')
              : code === 'ONBOARDING_SOURCE_INACTIVE'
                ? t('sourceInactive')
                : code === 'ONBOARDING_SOURCE_AMBIGUOUS'
                  ? t('sourceAmbiguous')
                  : t('loadError')}
          </p>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring mt-5 min-h-11 px-5 text-sm font-semibold"
            onClick={() => void onboarding.retry()}
          >
            {t('retry')}
          </Button>
        </Card>
      </main>
    )
  }

  // A suspended account is not something the merchant can act on from here,
  // so the whole flow is replaced by a notice instead of a blocked step.
  if (
    onboarding.accountStatus === 'suspended' &&
    !onboarding.state.isOnboardingComplete
  ) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4">
        <Card className="border-warning-border w-full p-6 text-center">
          <ShieldCheck className="text-warning mx-auto size-8" />
          <h1 className="text-foreground mt-3 text-xl font-bold">
            {t('suspended.title')}
          </h1>
          <p className="text-foreground/70 mt-2 text-sm">
            {t('suspended.body')}
          </p>
          <p className="text-muted-foreground mt-3 text-xs">
            {t('suspended.note')}
          </p>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring mt-5 min-h-11 px-5 text-sm font-semibold"
            onClick={() => void onboarding.retry()}
          >
            {t('suspended.refresh')}
          </Button>
        </Card>
      </main>
    )
  }

  const disabled = !canManage
  const definition = getStepDefinition(currentStep)
  const primaryLabel = !canManage
    ? t('actions.continue')
    : currentStep === 3
      ? isCompleting
        ? t('completing')
        : t('complete')
      : isSaving
        ? t('saving')
        : t('actions.saveAndContinue')

  return (
    <main className="mx-auto w-full max-w-280 px-4 py-6 sm:px-6 sm:py-10">
      <header className="text-start">
        <p className="text-primary text-sm font-semibold">{t('eyebrow')}</p>
        <h1 className="text-foreground mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-foreground/70 mt-2 text-sm sm:text-base">
          {t('subtitle')}
        </p>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:mt-8 lg:grid-cols-[280px_minmax(0,740px)] lg:justify-center lg:gap-8">
        <OnboardingStepRail
          currentStep={currentStep}
          completedSteps={completedSteps}
          canGoToStep={canGoToStep}
          onSelectStep={goToStep}
        />

        <div className="space-y-4">
          <OnboardingStepProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
          />

          <p aria-live="polite" className="sr-only">
            {definition
              ? t('status.stepAnnouncement', {
                  current: currentStep,
                  total: STANDALONE_TOTAL_STEPS,
                  title: t(definition.titleKey),
                })
              : null}
          </p>

          {disabled && (
            <div
              role="status"
              className="border-warning-border bg-warning-subtle text-warning-subtle-foreground rounded-xl border p-4 text-start text-sm"
            >
              {t('readOnly')}
            </div>
          )}
          {onboarding.errorMessage && (
            <div
              role="alert"
              className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground flex items-start gap-2 rounded-xl border p-4 text-start text-sm"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-px h-4 w-4 shrink-0"
              />
              {onboarding.errorMessage}
            </div>
          )}
          {onboarding.successMessage && (
            <div
              role="status"
              className="border-primary-border bg-primary-subtle text-primary flex items-start gap-2 rounded-xl border p-4 text-start text-sm"
            >
              <CheckCircle2
                aria-hidden="true"
                className="mt-px h-4 w-4 shrink-0"
              />
              {onboarding.successMessage}
            </div>
          )}

          <Card variant="flat" className="overflow-hidden p-0">
            <div className="space-y-6 p-5 text-start sm:p-6">
              <div>
                <p className="bg-muted text-foreground/70 inline-flex rounded-md px-2 py-1 text-xs font-medium tabular-nums">
                  {t('steps.progress', {
                    current: currentStep,
                    total: STANDALONE_TOTAL_STEPS,
                  })}
                </p>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-foreground mt-3 text-xl font-bold focus-visible:outline-none sm:text-2xl"
                >
                  {definition ? t(definition.headingKey) : null}
                </h2>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  {definition ? t(definition.subheadingKey) : null}
                </p>
              </div>

              {currentStep === 1 && (
                <StoreDetailsStep
                  form={onboarding.form}
                  fieldErrors={onboarding.fieldErrors}
                  disabled={disabled}
                  onFieldChange={onboarding.setField}
                />
              )}
              {currentStep === 2 && (
                <ConfirmationRulesStep
                  form={onboarding.form}
                  fieldErrors={onboarding.fieldErrors}
                  disabled={disabled}
                  onFieldChange={onboarding.setField}
                />
              )}
              {currentStep === 3 && (
                <ReviewStep
                  form={onboarding.form}
                  blockedReasons={onboarding.blockedReasons}
                  onEdit={goToStep}
                />
              )}
            </div>

            <div className="border-border bg-card flex flex-col gap-4 border-t p-5 sm:flex-row-reverse sm:items-center sm:justify-between sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:gap-3">
                {/* Read-only users have nothing to do past the review step. */}
                {(canManage || currentStep < STANDALONE_TOTAL_STEPS) && (
                  <Button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handlePrimary()}
                    className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring min-h-11 w-full gap-2 px-5 text-sm font-semibold sm:w-auto"
                  >
                    {primaryLabel}
                    {currentStep < 3 && (
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 rtl:rotate-180"
                      />
                    )}
                  </Button>
                )}
                {canManage && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isBusy}
                    onClick={() => void handleSaveProgress()}
                    className="text-foreground/80 hover:bg-muted min-h-11 w-full px-5 text-sm font-semibold sm:w-auto"
                  >
                    {t('saveProgress')}
                  </Button>
                )}
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() =>
                      goToStep((currentStep - 1) as StandaloneStep)
                    }
                    className="border-border bg-card text-foreground/80 hover:bg-muted/50 min-h-11 w-full px-5 text-sm font-semibold sm:w-auto"
                  >
                    {t('actions.back')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
