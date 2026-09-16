'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getSupabaseClient } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { AuthPanel } from '@/shared/auth/AuthPanel'
import { Input, Label, LoadingButton } from '@/shared/ui'

/**
 * Forgot Password Page - Standalone Mode Only
 *
 * Allows users to request a password reset link via Supabase.
 */

export default function ForgotPasswordPage() {
  const logger = createLogger('Auth')
  const t = useTranslations()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/${locale}/reset-password` }
      )

      if (resetError) {
        logger.error('Password reset error', resetError)
        setError(t('auth.resetLinkFailed'))
      } else {
        setSuccess(true)
      }
    } catch (error) {
      logger.error('Password reset failed', error)
      setError(t('auth.resetLinkFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthPanel title={t('auth.forgotPasswordTitle')}>
        <div className="space-y-6 text-center">
          <div className="bg-primary-subtle text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <MailCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p role="status" className="text-muted-foreground text-sm">
            {t('auth.resetLinkSent')}
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
      title={t('auth.forgotPasswordTitle')}
      description={t('auth.forgotPasswordSubtitle')}
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

        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-control"
            placeholder={t('auth.email')}
          />
        </div>

        <LoadingButton
          type="submit"
          size="lg"
          className="auth-gradient-button w-full"
          loading={isLoading}
          loadingText={t('auth.sendingResetLink')}
        >
          {t('auth.sendResetLink')}
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
