'use client'

import { useCallback, useEffect, useRef } from 'react'
import { RotateCw, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { auth, getEmailRedirectUrl } from '@/shared/lib/auth'
import { cn } from '@/shared/lib/utils'
import { Button, akCard } from '@/shared/ui'
import { useResendCooldown } from '../useResendCooldown'

interface VerifyEmailCardProps {
  email: string
  locale: string
  onChangeEmail: () => void
}

const NEXT_STEPS = ['verify', 'whatsapp', 'test'] as const

/**
 * The wait between signup and the inbox: where the link went, what happens
 * after it, and the two ways out when it does not arrive (resend, fix the
 * address). The job itself is in the inbox, so there is no primary button.
 */
export function VerifyEmailCard({
  email,
  locale,
  onChangeEmail,
}: VerifyEmailCardProps) {
  const t = useTranslations('auth.verifyEmail')
  const headingRef = useRef<HTMLHeadingElement>(null)

  const send = useCallback(
    () =>
      auth.resendSignupEmail(
        email,
        getEmailRedirectUrl(locale, window.location.origin)
      ),
    [email, locale]
  )
  const { secondsLeft, status, canResend, resend } = useResendCooldown({
    send,
    startCoolingDown: true,
  })

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section
      aria-labelledby="verify-email-heading"
      className={cn(akCard, 'mx-auto w-full max-w-2xl overflow-hidden')}
    >
      <div className="space-y-6 p-6 text-start sm:p-10">
        <span
          aria-hidden="true"
          className="bg-brand-soft text-brand-ink inline-flex size-16 items-center justify-center rounded-full"
        >
          <Send className="size-7 rtl:-scale-x-100" />
        </span>

        <header className="space-y-3">
          <h1
            id="verify-email-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-ink text-h2 font-bold focus-visible:outline-none"
          >
            {t('heading')}
          </h1>
          <p className="text-ink text-body">
            {t.rich('body', {
              email: () => (
                <bdi dir="ltr" className="font-semibold">
                  {email}
                </bdi>
              ),
            })}
          </p>
        </header>

        <ol className="border-line bg-surface-sunken rounded-panel space-y-4 border p-5">
          {NEXT_STEPS.map((step, index) => {
            const isCurrent = index === 0
            return (
              <li
                key={step}
                aria-current={isCurrent ? 'step' : undefined}
                className="flex items-center gap-3"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'border-line-strong text-ink-muted border-2'
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'text-body',
                    isCurrent ? 'text-ink font-semibold' : 'text-ink'
                  )}
                >
                  {t(`steps.${step}`)}
                </span>
              </li>
            )
          })}
        </ol>

        <p className="text-ink-muted text-sm">{t('caption')}</p>
      </div>

      <footer className="border-line bg-surface-sunken space-y-3 border-t p-5 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="link"
            onClick={onChangeEmail}
            className="h-auto self-start p-0 font-semibold sm:self-center"
          >
            {t('changeEmail')}
          </Button>
          <p className="text-ink-muted flex-1 text-sm">{t('spamHint')}</p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => void resend()}
            disabled={!canResend}
            className="gap-2 tabular-nums"
          >
            {secondsLeft > 0
              ? t('resendIn', { seconds: secondsLeft })
              : status === 'sending'
                ? t('resending')
                : t('resend')}
            <RotateCw
              aria-hidden="true"
              className={cn('size-4', status === 'sending' && 'animate-spin')}
            />
          </Button>
        </div>

        <p
          role="status"
          className={cn(
            'text-sm font-medium',
            status === 'sent' && 'text-brand-ink',
            status === 'error' && 'text-destructive',
            status !== 'sent' && status !== 'error' && 'sr-only'
          )}
        >
          {status === 'sent' && t('resent')}
          {status === 'error' && t('resendFailed')}
        </p>
      </footer>
    </section>
  )
}
