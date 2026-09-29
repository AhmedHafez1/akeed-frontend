'use client'

import { Suspense, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { auth } from '@/shared/lib/auth'
import {
  AUTH_ERROR_PARAM,
  getAuthErrorCode,
  parseAuthErrorParam,
} from '@/shared/lib/authErrors'
import { createLogger } from '@/shared/lib/logger'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { AuthPanel } from '@/shared/auth/AuthPanel'
import { PasswordInput } from '@/shared/auth/PasswordInput'
import { ResendConfirmationNotice } from '@/shared/auth/ResendConfirmationNotice'
import { ShopifyContinueLink } from '@/shared/auth/ShopifyContinueLink'
import { Input, Label, LoadingButton, Separator } from '@/shared/ui'

/**
 * Login Page - Standalone Mode Only
 *
 * This page is for users accessing app.akeed.com directly.
 * Shopify merchants will never see this - they use OAuth.
 */

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const logger = createLogger('Auth')
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [emailMissing, setEmailMissing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const hasError = Boolean(error)
  const linkError = parseAuthErrorParam(searchParams?.get(AUTH_ERROR_PARAM))
  const resendMessage = emailNotConfirmed
    ? t('auth.emailNotConfirmed')
    : linkError
      ? t(`auth.linkError.${linkError}`)
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailNotConfirmed(false)
    setIsLoading(true)

    try {
      await auth.signIn(email, password)

      // Redirect to dashboard
      router.push(auth.getDashboardPath(locale))
    } catch (error) {
      logger.error('Sign in failed', error)
      if (getAuthErrorCode(error) === 'email_not_confirmed') {
        setEmailNotConfirmed(true)
      } else {
        setError(t('auth.signInFailed'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPanel title={t('auth.signInToAccount')}>
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {resendMessage && (
          <ResendConfirmationNotice
            message={resendMessage}
            email={email}
            locale={locale}
            onEmailMissing={() => {
              setEmailMissing(true)
              document.getElementById('email')?.focus()
            }}
          />
        )}

        {error && (
          <div
            id="auth-error"
            role="alert"
            className="rounded-control border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm"
          >
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailMissing(false)
              }}
              aria-describedby={
                emailMissing
                  ? 'email-missing'
                  : hasError
                    ? 'auth-error'
                    : undefined
              }
              aria-invalid={hasError || emailMissing}
              className="rounded-control"
              placeholder={t('auth.email')}
            />
            {emailMissing && (
              <p
                id="email-missing"
                className="text-ak-warning text-sm font-medium"
              >
                {t('auth.linkError.emailMissing')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={hasError ? 'auth-error' : undefined}
              aria-invalid={hasError}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="text-primary border-input focus-visible:ring-ring h-4 w-4 rounded focus-visible:ring-2"
            />
            {t('auth.rememberMe')}
          </label>

          <Link
            href={withLocale('/forgot-password', locale)}
            className="text-primary hover:text-primary-hover text-sm font-semibold transition-colors focus-visible:underline focus-visible:outline-none"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <LoadingButton
          type="submit"
          size="lg"
          className="auth-gradient-button w-full"
          loading={isLoading}
          loadingText={t('auth.signingIn')}
        >
          {t('auth.signIn')}
        </LoadingButton>

        <p className="text-muted-foreground text-center text-sm">
          {t('auth.dontHaveAccount')}{' '}
          <Link
            href={auth.getSignupPath(locale)}
            className="text-primary hover:text-primary-hover font-semibold transition-colors focus-visible:underline focus-visible:outline-none"
          >
            {t('auth.signUp')}
          </Link>
        </p>
      </form>

      <div className="mt-8 space-y-4">
        <div className="relative flex items-center">
          <Separator className="flex-1" />
          <span className="text-muted-foreground px-3 text-xs font-semibold tracking-widest uppercase">
            {t('auth.orContinueWith')}
          </span>
          <Separator className="flex-1" />
        </div>

        <ShopifyContinueLink>
          {t('auth.continueWithShopify')}
        </ShopifyContinueLink>
      </div>
    </AuthPanel>
  )
}
