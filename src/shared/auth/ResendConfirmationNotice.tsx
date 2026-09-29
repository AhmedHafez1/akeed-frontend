'use client'

import { useCallback } from 'react'
import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { auth, getEmailRedirectUrl } from '@/shared/lib/auth'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'
import { isValidEmail } from './signup/signup.model'
import { useResendCooldown } from './useResendCooldown'

interface ResendConfirmationNoticeProps {
  /** One line saying why sign-in needs a new link. */
  message: string
  email: string
  locale: string
  /** Called instead of sending when the email field is empty or invalid. */
  onEmailMissing: () => void
}

/**
 * Shown on sign-in when the confirmation link was expired or already used, or
 * the email is not confirmed yet: the reason, and a way to get a new link
 * sent to the address in the email field.
 */
export function ResendConfirmationNotice({
  message,
  email,
  locale,
  onEmailMissing,
}: ResendConfirmationNoticeProps) {
  const t = useTranslations('auth.linkError')

  const send = useCallback(
    () =>
      auth.resendSignupEmail(
        email.trim(),
        getEmailRedirectUrl(locale, window.location.origin)
      ),
    [email, locale]
  )
  const { secondsLeft, status, canResend, resend } = useResendCooldown({
    send,
  })

  const handleResend = () => {
    if (!isValidEmail(email)) {
      onEmailMissing()
      return
    }
    void resend()
  }

  return (
    <div className="border-info-border bg-info-subtle text-info-subtle-foreground rounded-panel space-y-3 border p-4 text-sm">
      <p className="flex items-start gap-2">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{message}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3 ps-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={!canResend}
          className="bg-card tabular-nums"
        >
          {secondsLeft > 0
            ? t('resendIn', { seconds: secondsLeft })
            : status === 'sending'
              ? t('resending')
              : t('resend')}
        </Button>
        <p
          role="status"
          className={cn(
            'font-medium',
            status === 'error' && 'text-destructive',
            status !== 'sent' && status !== 'error' && 'sr-only'
          )}
        >
          {status === 'sent' && t('sent')}
          {status === 'error' && t('failed')}
        </p>
      </div>
    </div>
  )
}
