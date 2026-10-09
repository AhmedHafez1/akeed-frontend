'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, ShieldCheck } from 'lucide-react'
import type { StandaloneStep } from '@/features/onboarding/domain/onboarding.types'
import { resolveTestReply } from '@/features/onboarding/hooks/useOnboardingTest'
import { useStandaloneOnboardingFlow } from '@/features/onboarding/hooks/useStandaloneOnboardingFlow'
import {
  STANDALONE_FIELD_IDS,
  STANDALONE_STEP_NUMBER,
  STANDALONE_TOTAL_STEPS,
} from '@/features/onboarding/model/standaloneStore'
import { Button, Card, Skeleton } from '@/shared/ui'
import { DoneStep } from './steps/DoneStep'
import { StoreStep } from './steps/StoreStep'
import { TestStep } from './steps/TestStep'

const STEP_TITLE_KEYS: Record<StandaloneStep, string> = {
  store: 'flow.store',
  test: 'flow.test',
  done: 'flow.test',
}

function focusField(id: string) {
  const element = document.getElementById(id)
  if (element instanceof HTMLElement) {
    element.focus()
    element.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

/**
 * Standalone onboarding v2: Your store → Try the message → You're live, as
 * one page with the step in the URL. The shell's stepper reads the same
 * `?step`, so the two never disagree.
 */
export function StandaloneOnboardingPage() {
  const t = useTranslations('standaloneOnboarding')
  const flow = useStandaloneOnboardingFlow()
  const { step, state } = flow
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownStepRef = useRef<StandaloneStep | null>(null)

  // Land screen-reader and keyboard users at the top of each new step, but
  // not on the first render: the page itself just loaded.
  useEffect(() => {
    if (!state) return
    if (shownStepRef.current !== null && shownStepRef.current !== step) {
      headingRef.current?.focus()
    }
    shownStepRef.current = step
  }, [state, step])

  const { submit } = flow.store
  const handleSubmitStore = useCallback(async () => {
    const result = await submit()
    if (result.firstInvalidField) {
      focusField(STANDALONE_FIELD_IDS[result.firstInvalidField])
    }
  }, [submit])

  if (flow.isLoading || (!state && !flow.loadErrorCode)) {
    return (
      <PageFrame>
        {step === 'store' ? (
          <StoreStep
            store={flow.store}
            isLoading
            canManage
            headingRef={headingRef}
            onSubmit={() => undefined}
          />
        ) : (
          <div aria-busy="true" className="space-y-4">
            <Skeleton className="h-9 w-80 max-w-full" />
            <Skeleton className="h-5 w-[28rem] max-w-full" />
            <Skeleton className="rounded-panel h-80 w-full max-w-2xl" />
          </div>
        )}
      </PageFrame>
    )
  }

  if (!state) {
    const code = flow.loadErrorCode ?? 'UNAVAILABLE'
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4">
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
            className="mt-5 min-h-11 px-5 text-sm font-semibold"
            onClick={() => void flow.retry()}
          >
            {t('retry')}
          </Button>
        </Card>
      </section>
    )
  }

  // A suspended account is not something the merchant can act on from here,
  // so the whole flow is replaced by a notice instead of a blocked step.
  if (flow.accountStatus === 'suspended' && !state.isOnboardingComplete) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4">
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
            className="mt-5 min-h-11 px-5 text-sm font-semibold"
            onClick={() => void flow.retry()}
          >
            {t('suspended.refresh')}
          </Button>
        </Card>
      </section>
    )
  }

  return (
    <PageFrame>
      <p aria-live="polite" className="sr-only">
        {t('status.stepAnnouncement', {
          current: STANDALONE_STEP_NUMBER[step],
          total: STANDALONE_TOTAL_STEPS,
          title: t(STEP_TITLE_KEYS[step]),
        })}
      </p>

      {!flow.canManage && step !== 'done' && (
        <div
          role="status"
          className="border-warning-border bg-warning-subtle text-warning-subtle-foreground rounded-panel mb-6 flex items-start gap-2 border p-4 text-start text-sm"
        >
          <Eye aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t('readOnly')}
        </div>
      )}

      {step === 'store' && (
        <StoreStep
          store={flow.store}
          isLoading={false}
          canManage={flow.canManage}
          headingRef={headingRef}
          onSubmit={() => void handleSubmitStore()}
        />
      )}
      {step === 'test' && (
        <TestStep
          test={flow.test}
          completion={flow.completion}
          blockedReasons={flow.blockedReasons}
          phone={state.merchantWhatsappPhone ?? flow.store.form.phone}
          storeName={state.storeName ?? flow.store.form.storeName}
          canManage={flow.canManage}
          headingRef={headingRef}
        />
      )}
      {step === 'done' && (
        <DoneStep
          headingRef={headingRef}
          reply={resolveTestReply(flow.test.testState) ?? undefined}
        />
      )}
    </PageFrame>
  )
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-280 px-4 py-6 sm:px-6 sm:py-12">
      {children}
    </div>
  )
}
