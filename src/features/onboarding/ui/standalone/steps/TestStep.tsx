'use client'

import { useCallback, useMemo, type Ref } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  MessageCircle,
  Send,
} from 'lucide-react'
import type { StandaloneSetupBlockedReason } from '@/features/onboarding/domain/onboarding.types'
import type { OnboardingTestError } from '@/features/onboarding/hooks/useOnboardingTest'
import type { StandaloneOnboardingFlow } from '@/features/onboarding/hooks/useStandaloneOnboardingFlow'
import {
  buildTestTimeline,
  type TimelineRow,
} from '@/features/onboarding/model/onboardingTest'
import { formatPhoneForDisplay } from '@/features/onboarding/model/standaloneStore'
import { useCooldown } from '@/shared/hooks/useCooldown'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/utils'
import { Button, StatusBadge, akCard } from '@/shared/ui'
import {
  BlockedReasonsPanel,
  MessagePhonePreview,
  TestTimeline,
} from '../components'

const TEST_ERROR_KEYS: Record<OnboardingTestError, string> = {
  cooldown: 'errors.cooldown',
  daily_limit: 'errors.dailyLimit',
  phone_missing: 'errors.phoneMissing',
  send_failed: 'errors.sendFailed',
  skip_failed: 'errors.skipFailed',
}

/** The Akeed sender's WhatsApp chat, for "Open WhatsApp" on phones. */
function akeedWhatsAppHref(): string | null {
  const digits = (process.env.NEXT_PUBLIC_AKEED_WHATSAPP_NUMBER ?? '').replace(
    /\D/g,
    ''
  )
  return digits ? `https://wa.me/${digits}` : null
}

interface TestStepProps {
  test: StandaloneOnboardingFlow['test']
  completion: StandaloneOnboardingFlow['completion']
  blockedReasons: readonly StandaloneSetupBlockedReason[]
  /** The saved number, shown until the test state reports its own. */
  phone: string
  storeName: string
  canManage: boolean
  headingRef: Ref<HTMLHeadingElement>
}

/**
 * Step "Try the message": the free test on the merchant's own phone with a
 * live timeline. The action is on the phone, so there is no primary on
 * desktop; resend and skip stay quiet.
 */
export function TestStep({
  test,
  completion,
  blockedReasons,
  phone,
  storeName,
  canManage,
  headingRef,
}: TestStepProps) {
  const t = useTranslations('standaloneOnboarding.test')
  const tTest = useTranslations('onboarding.test')
  const locale = useLocale()
  const isPhone = useMediaQuery('(max-width: 639px)')
  const { testState } = test
  const attempt = testState?.test ?? null
  const status = attempt?.status
  const cooldownSeconds = useCooldown(testState?.resendAvailableAt)
  const canResend = (testState?.sendsRemainingToday ?? 1) > 0
  const isAwaitingTap =
    status === 'sent' || status === 'delivered' || status === 'read'
  const isFailed = status === 'failed' || status === 'expired'
  const isBusy = test.isSending || test.isSkipping || completion.isCompleting
  const whatsAppHref = akeedWhatsAppHref()
  const shownPhone = formatPhoneForDisplay(testState?.phone ?? phone)

  const formatTime = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        numberingSystem: 'latn',
      }).format(new Date(iso)),
    [locale]
  )

  const timeline = useMemo<TimelineRow[]>(() => {
    const rows = buildTestTimeline(
      attempt,
      {
        sending: tTest('timeline.sending'),
        sent: tTest('timeline.sent'),
        awaitingDelivery: tTest('timeline.awaitingDelivery'),
        delivered: tTest('timeline.delivered'),
        tapConfirm: isPhone ? t('mobile.tapConfirm') : t('tapConfirmOnPhone'),
        confirmed: tTest('timeline.confirmed'),
        canceledNote: t('timeline.canceledNote'),
        autoDetect: isPhone ? t('mobile.autoDetect') : t('autoDetectNext'),
      },
      formatTime
    ).map((row) =>
      row.id === 'tap' && row.state === 'current' && !row.note
        ? { ...row, note: t('tapNote') }
        : row
    )
    // On a phone the list is short: once it has arrived, "sent" says nothing.
    return isPhone && rows[1]?.state === 'done'
      ? rows.filter((row) => row.id !== 'sent')
      : rows
  }, [attempt, formatTime, isPhone, t, tTest])

  const resendLabel = !attempt
    ? t('send')
    : cooldownSeconds > 0
      ? t('resendIn', { seconds: cooldownSeconds })
      : tTest('resend')

  const heading = (
    <header className="space-y-2 text-start">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-ink text-h2 font-bold focus-visible:outline-none"
      >
        {tTest('heading')}
      </h1>
      <p className="text-ink-muted text-body">
        {test.isUnavailable
          ? t('unavailable.subheading')
          : isPhone
            ? t('mobile.subheading')
            : tTest('subheading')}
      </p>
    </header>
  )

  const completionNotices = (
    <>
      {blockedReasons.length > 0 && (
        <BlockedReasonsPanel reasons={blockedReasons} />
      )}
      {completion.error && (
        <div
          role="alert"
          className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-panel flex flex-wrap items-center justify-between gap-3 border p-4 text-sm"
        >
          <span className="flex items-start gap-2">
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            {completion.error}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={completion.retry}
          >
            {t('unavailable.retry')}
          </Button>
        </div>
      )}
      {completion.isCompleting && (
        <p role="status" className="text-ink-muted text-sm">
          {t('completing')}
        </p>
      )}
    </>
  )

  const phoneNumber = (
    <span dir="ltr" className="text-ink text-xl font-semibold tabular-nums">
      {shownPhone}
    </span>
  )

  if (test.isUnavailable) {
    return (
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">
        <div className="space-y-6">
          {heading}
          <div
            role="alert"
            className="border-ak-warning-line bg-ak-warning-soft rounded-panel flex items-start gap-3 border p-4 text-start"
          >
            <AlertTriangle
              aria-hidden="true"
              className="text-ak-warning mt-0.5 size-5 shrink-0"
            />
            <div className="space-y-0.5">
              <p className="text-ak-warning text-sm font-semibold">
                {t('unavailable.title')}
              </p>
              <p className="text-ink text-sm">{t('unavailable.body')}</p>
            </div>
          </div>

          <div className={cn(akCard, 'p-5 text-start sm:p-6')}>
            <p className="text-ink-muted text-sm">
              {t('unavailable.numberLabel')}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              {phoneNumber}
              <StatusBadge kind="failed">{t('unavailable.badge')}</StatusBadge>
            </div>
          </div>

          {completionNotices}

          {canManage && (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isBusy || cooldownSeconds > 0 || !canResend}
                onClick={test.retry}
                className="gap-2"
              >
                <Send aria-hidden="true" className="rtl:-scale-x-100" />
                {cooldownSeconds > 0
                  ? t('resendIn', { seconds: cooldownSeconds })
                  : t('unavailable.retry')}
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={isBusy}
                onClick={test.continueToDashboard}
                className="gap-2 font-semibold"
              >
                {t('unavailable.continue')}
                <ArrowRight aria-hidden="true" className="rtl:rotate-180" />
              </Button>
            </div>
          )}
        </div>

        <MessagePhonePreview
          className="hidden lg:block"
          template={null}
          language="ar"
          storeName={storeName}
          currency="EGP"
          isEmpty
        />
      </div>
    )
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">
      <div className="space-y-6">
        {heading}

        {test.error && (
          <div
            role="alert"
            className="border-ak-warning-line bg-ak-warning-soft text-ink rounded-panel flex items-start gap-2 border p-4 text-start text-sm"
          >
            <AlertTriangle
              aria-hidden="true"
              className="text-ak-warning mt-0.5 size-4 shrink-0"
            />
            {tTest(TEST_ERROR_KEYS[test.error])}
          </div>
        )}
        {isFailed && (
          <div
            role="alert"
            className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-panel flex items-start gap-2 border p-4 text-start text-sm"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            {tTest('failed')}
          </div>
        )}

        <div className={cn(akCard, 'overflow-hidden text-start')}>
          <div className="flex items-end justify-between gap-3 p-5 sm:p-6">
            <div className="min-w-0">
              <p className="text-ink-muted text-sm">{tTest('sentTo')}</p>
              <p className="mt-1">{phoneNumber}</p>
            </div>
            {canManage && !isFailed && (
              <Button
                type="button"
                variant="link"
                onClick={test.changeNumber}
                className="h-auto min-h-11 shrink-0 p-0 font-semibold"
              >
                {tTest('changeNumber')}
              </Button>
            )}
          </div>
          <div className="border-line border-t p-5 sm:p-6">
            <TestTimeline rows={timeline} />
          </div>
        </div>

        <p className="text-ink-muted flex items-center gap-2 text-sm">
          <Info aria-hidden="true" className="size-4 shrink-0" />
          {t('freeNote')}
        </p>

        {completionNotices}

        {canManage && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {isFailed && (
              <Button
                type="button"
                size="lg"
                onClick={test.changeNumber}
                className="w-full font-semibold sm:w-auto"
              >
                {tTest('changeNumber')}
              </Button>
            )}
            {!isFailed && whatsAppHref && (
              <Button
                asChild
                size="lg"
                className="w-full gap-2 font-semibold sm:hidden"
              >
                <a href={whatsAppHref} target="_blank" rel="noreferrer">
                  <MessageCircle aria-hidden="true" />
                  {t('openWhatsApp')}
                </a>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isBusy || cooldownSeconds > 0 || !canResend}
              onClick={test.retry}
              className="w-full sm:w-auto"
            >
              {resendLabel}
            </Button>
            <Button
              type="button"
              variant="link"
              disabled={isBusy}
              onClick={test.skip}
              className="text-ink-muted hover:text-ink h-auto min-h-11 self-center p-0 font-normal underline"
            >
              {t('skip')}
            </Button>
          </div>
        )}
      </div>

      <MessagePhonePreview
        className="hidden lg:block"
        template={testState?.preview ?? null}
        language={testState?.language ?? 'ar'}
        storeName={testState?.sample.storeName || storeName}
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
      />
    </div>
  )
}
