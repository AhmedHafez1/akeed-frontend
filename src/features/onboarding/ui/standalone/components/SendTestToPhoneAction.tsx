'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, AlertTriangle, Info, Send } from 'lucide-react'
import {
  useOnboardingTest,
  type OnboardingTestError,
} from '@/features/onboarding/hooks/useOnboardingTest'
import {
  buildTestTimeline,
  type TimelineRow,
} from '@/features/onboarding/model/onboardingTest'
import { formatPhoneForDisplay } from '@/features/onboarding/model/standaloneStore'
import { useCooldown } from '@/shared/hooks/useCooldown'
import { queryKeys } from '@/shared/query/keys'
import { cn } from '@/shared/lib/utils'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import { MessagePhonePreview } from './MessagePhonePreview'
import { TestTimeline } from './TestTimeline'

const TEST_ERROR_KEYS: Record<OnboardingTestError, string> = {
  cooldown: 'errors.cooldown',
  daily_limit: 'errors.dailyLimit',
  phone_missing: 'errors.phoneMissing',
  send_failed: 'errors.sendFailed',
  skip_failed: 'errors.skipFailed',
}

interface SendTestToPhoneActionProps {
  /** `link` is the quiet text action; `outline` a secondary button. */
  variant?: 'link' | 'outline'
  className?: string
}

/**
 * "Send it to my phone": the free onboarding test (POST /api/onboarding/test,
 * billing-exempt) to the merchant's saved WhatsApp number, with the live
 * timeline and the message on a phone in a compact dialog. Used after
 * onboarding by the dashboard's skipped-test reminder and the empty
 * confirmations page; it never asks for a customer number or spends a credit.
 */
export function SendTestToPhoneAction({
  variant = 'link',
  className,
}: SendTestToPhoneActionProps) {
  const t = useTranslations('standaloneOnboarding.phoneTest')
  const tStep = useTranslations('standaloneOnboarding.test')
  const tTest = useTranslations('onboarding.test')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const freshSendRequestedRef = useRef(false)

  const onConfirmed = useCallback(() => {
    // The reminder and the first-run card read the onboarding state.
    void queryClient.invalidateQueries({
      queryKey: queryKeys.onboarding.state(),
    })
  }, [queryClient])
  const noop = useCallback(() => undefined, [])

  const test = useOnboardingTest({
    isActive: isOpen,
    freshSendRequestedRef,
    onConfirmed,
    onSkipped: noop,
    autoSend: false,
  })
  const { testState } = test
  const attempt = testState?.test ?? null
  const status = attempt?.status
  const cooldownSeconds = useCooldown(testState?.resendAvailableAt)
  const canResend = (testState?.sendsRemainingToday ?? 1) > 0
  const isAwaitingTap =
    status === 'sent' || status === 'delivered' || status === 'read'
  const isFailed = status === 'failed' || status === 'expired'

  const open = () => {
    // The hook sends as soon as the test state is loaded.
    freshSendRequestedRef.current = true
    setIsOpen(true)
  }

  const formatTime = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        numberingSystem: 'latn',
      }).format(new Date(iso)),
    [locale]
  )

  const timeline = useMemo<TimelineRow[]>(
    () =>
      buildTestTimeline(
        attempt,
        {
          sending: tTest('timeline.sending'),
          sent: tTest('timeline.sent'),
          awaitingDelivery: tTest('timeline.awaitingDelivery'),
          delivered: tTest('timeline.delivered'),
          tapConfirm: tStep('tapConfirmOnPhone'),
          confirmed: tTest('timeline.confirmed'),
          canceledNote: tStep('timeline.canceledNote'),
          autoDetect: tStep('autoDetectNext'),
        },
        formatTime
      ),
    [attempt, formatTime, tStep, tTest]
  )

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={open}
        className={cn(
          variant === 'link'
            ? 'h-auto min-h-11 p-0 font-semibold'
            : 'gap-2 font-semibold',
          className
        )}
      >
        {variant === 'outline' && (
          <Send aria-hidden="true" className="rtl:-scale-x-100" />
        )}
        {t('action')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          closeLabel={t('close')}
          className="border-border bg-card max-h-[90vh] overflow-y-auto rounded-[18px] p-5 sm:max-w-[760px] sm:p-7"
        >
          <DialogHeader className="text-start">
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          <div className="grid items-start gap-6 sm:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-4 text-start">
              {test.isUnavailable ? (
                <p
                  role="alert"
                  className="border-ak-warning-line bg-ak-warning-soft text-ink rounded-panel flex items-start gap-2 border p-3 text-sm"
                >
                  <AlertTriangle
                    aria-hidden="true"
                    className="text-ak-warning mt-0.5 size-4 shrink-0"
                  />
                  {tStep('unavailable.title')}
                </p>
              ) : (
                test.error && (
                  <p
                    role="alert"
                    className="border-ak-warning-line bg-ak-warning-soft text-ink rounded-panel flex items-start gap-2 border p-3 text-sm"
                  >
                    <AlertTriangle
                      aria-hidden="true"
                      className="text-ak-warning mt-0.5 size-4 shrink-0"
                    />
                    {tTest(TEST_ERROR_KEYS[test.error])}
                  </p>
                )
              )}
              {isFailed && (
                <p
                  role="alert"
                  className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-panel flex items-start gap-2 border p-3 text-sm"
                >
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  {tTest('failed')}
                </p>
              )}

              {testState?.phone && (
                <div>
                  <p className="text-ink-muted text-sm">{tTest('sentTo')}</p>
                  <p
                    dir="ltr"
                    className="text-ink mt-1 text-lg font-semibold tabular-nums rtl:text-end"
                  >
                    {formatPhoneForDisplay(testState.phone)}
                  </p>
                </div>
              )}

              <TestTimeline rows={timeline} />

              <p className="text-ink-muted flex items-center gap-2 text-sm">
                <Info aria-hidden="true" className="size-4 shrink-0" />
                {tStep('freeNote')}
              </p>

              <Button
                type="button"
                variant="outline"
                disabled={test.isSending || cooldownSeconds > 0 || !canResend}
                onClick={test.resend}
                className="w-full sm:w-auto"
              >
                {cooldownSeconds > 0
                  ? tStep('resendIn', { seconds: cooldownSeconds })
                  : tTest('resend')}
              </Button>
            </div>

            <MessagePhonePreview
              className="mx-auto w-full max-w-[240px]"
              template={testState?.preview ?? null}
              language={testState?.language ?? 'ar'}
              storeName={testState?.sample.storeName ?? ''}
              currency={testState?.sample.currency ?? 'EGP'}
              customerName={testState?.sample.customerName}
              orderNumber={testState?.sample.orderNumber}
              totalMinor={
                testState
                  ? Math.round(Number(testState.sample.total) * 100)
                  : undefined
              }
              sentAt={attempt?.sentAt}
              emphasizeConfirm={isAwaitingTap}
              isEmpty={test.isUnavailable}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
