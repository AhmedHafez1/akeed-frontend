'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getSupabaseClient } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { AuthPanel } from '@/shared/auth/AuthPanel'
import { PasswordInput } from '@/shared/auth/PasswordInput'
import { Label, LoadingButton } from '@/shared/ui'

/**
 * Reset Password Page - Standalone Mode Only
 *
 * Consumes the Supabase recovery token (delivered via email link)
 * and allows the user to set a new password via `updateUser`.
 */

export default function ResetPasswordPage() {
  const logger = createLogger('Auth')
  const t = useTranslations()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Listen for the PASSWORD_RECOVERY event that fires when Supabase
    // processes the recovery token from the email link.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Also check if a session already exists (user may have landed here
    // after the event already fired).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }

    if (password.length < 8) {
      setError(t('auth.passwordRequirement'))
      return
    }

    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        logger.error('Password update error', updateError)
        setError(t('auth.resetPasswordFailed'))
      } else {
        setSuccess(true)
      }
    } catch (error) {
      logger.error('Password update failed', error)
      setError(t('auth.resetPasswordFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // If the recovery session is not ready, show a waiting state
  if (!sessionReady) {
    return (
      <AuthPanel
        title={t('auth.resetPasswordTitle')}
        description={t('auth.resetPasswordProcessing')}
      />
    )
  }

  if (success) {
    return (
      <AuthPanel title={t('auth.resetPasswordTitle')}>
        <div className="space-y-6 text-center">
          <div className="bg-primary-subtle text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <p role="status" className="text-muted-foreground text-sm">
            {t('auth.resetPasswordSuccess')}
          </p>
          <Link
            href={withLocale('/login', locale)}
            className="text-primary hover:text-primary-hover inline-flex text-sm font-semibold transition-colors focus-visible:underline focus-visible:outline-none"
          >
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel
      title={t('auth.resetPasswordTitle')}
      description={t('auth.resetPasswordSubtitle')}
    >
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-control border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm"
          >
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.newPassword')}</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="password-hint"
              placeholder={t('auth.newPassword')}
            />
            <p id="password-hint" className="text-muted-foreground text-xs">
              {t('auth.passwordRequirement')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.confirmPassword')}
            />
          </div>
        </div>

        <LoadingButton
          type="submit"
          size="lg"
          className="auth-gradient-button w-full"
          loading={isLoading}
          loadingText={t('auth.resettingPassword')}
        >
          {t('auth.resetPassword')}
        </LoadingButton>

        <p className="text-center">
          <Link
            href={withLocale('/login', locale)}
            className="text-muted-foreground hover:text-primary text-sm font-semibold transition-colors focus-visible:underline focus-visible:outline-none"
          >
            {t('auth.backToSignIn')}
          </Link>
        </p>
      </form>
    </AuthPanel>
  )
}
