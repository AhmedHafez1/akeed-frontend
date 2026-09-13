'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { auth } from '@/shared/lib/auth'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { createLogger } from '@/shared/lib/logger'
import { AuthPanel } from '@/shared/auth/AuthPanel'
import { PasswordInput } from '@/shared/auth/PasswordInput'
import { ShopifyContinueLink } from '@/shared/auth/ShopifyContinueLink'
import { Button, Input, Label, LoadingButton, Separator } from '@/shared/ui'

/**
 * Signup Page - Standalone Mode Only
 *
 * For new users who want to try Akeed without Shopify
 * Allows connection to multiple platforms later
 */

export default function SignupPage() {
  const logger = createLogger('Auth')
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
  })
  const [error, setError] = useState('')
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (fieldErrors[name as 'password' | 'confirmPassword']) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    const nextErrors: typeof fieldErrors = {}
    if (formData.password.length < 8) {
      nextErrors.password = t('auth.passwordRequirement')
    }

    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = t('auth.passwordsDoNotMatch')
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setIsLoading(true)

    try {
      // Create user account
      const data = await auth.signUp(formData.email, formData.password, {
        metadata: {
          full_name: formData.fullName,
          company_name: formData.companyName,
        },
        emailRedirectTo: new URL(
          auth.getDashboardPath(locale),
          window.location.origin
        ).toString(),
      })

      if (!data.session) {
        setVerificationEmail(formData.email)
        return
      }

      // Redirect to standalone dashboard
      router.push(auth.getDashboardPath(locale))
    } catch (error) {
      logger.error('Sign up failed', error)
      setError(t('auth.signUpFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (verificationEmail) {
    return (
      <AuthPanel title={t('auth.verifyEmailTitle')}>
        <div className="space-y-6 text-center">
          <div className="bg-primary-subtle text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              {t('auth.verifyEmailMessage', { email: verificationEmail })}
            </p>
            <p className="text-muted-foreground text-xs">
              {t('auth.verifyEmailHint')}
            </p>
          </div>
          <Button asChild size="lg" className="auth-gradient-button">
            <Link href={auth.getLoginPath(locale)}>
              {t('auth.backToSignIn')}
            </Link>
          </Button>
        </div>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel title={t('auth.createAccount')}>
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
            <Label htmlFor="fullName">{t('auth.fullName')}</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="rounded-control"
              placeholder={t('auth.fullName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">{t('auth.companyName')}</Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              autoComplete="organization"
              required
              maxLength={120}
              value={formData.companyName}
              onChange={handleChange}
              className="rounded-control"
              placeholder={t('auth.companyName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="rounded-control"
              placeholder={t('auth.email')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              aria-describedby="password-hint"
              aria-invalid={Boolean(fieldErrors.password)}
              className={
                fieldErrors.password
                  ? 'border-destructive focus:border-destructive'
                  : undefined
              }
            />
            <p id="password-hint" className="text-muted-foreground text-xs">
              {t('auth.passwordRequirement')}
            </p>
            {fieldErrors.password && (
              <p className="text-destructive text-xs">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              className={
                fieldErrors.confirmPassword
                  ? 'border-destructive focus:border-destructive'
                  : undefined
              }
            />
            {fieldErrors.confirmPassword && (
              <p className="text-destructive text-xs">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <label className="text-muted-foreground flex items-start gap-2 text-sm">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="text-primary border-input focus-visible:ring-ring mt-1 h-4 w-4 rounded focus-visible:ring-2"
          />
          <span>
            {t('auth.agreeToTerms')}{' '}
            <Link
              href={withLocale('/terms', locale)}
              className="text-primary hover:text-primary-hover font-semibold transition-colors focus-visible:underline focus-visible:outline-none"
              target="_blank"
            >
              {t('auth.termsOfService')}
            </Link>{' '}
            {t('auth.and')}{' '}
            <Link
              href={withLocale('/privacy', locale)}
              className="text-primary hover:text-primary-hover font-semibold transition-colors focus-visible:underline focus-visible:outline-none"
              target="_blank"
            >
              {t('auth.privacyPolicy')}
            </Link>
          </span>
        </label>

        <LoadingButton
          type="submit"
          size="lg"
          className="auth-gradient-button w-full"
          loading={isLoading}
          loadingText={t('auth.creatingAccount')}
        >
          {t('auth.createAccount')}
        </LoadingButton>

        <p className="text-muted-foreground text-center text-sm">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link
            href={auth.getLoginPath(locale)}
            className="text-primary hover:text-primary-hover font-semibold transition-colors focus-visible:underline focus-visible:outline-none"
          >
            {t('auth.signIn')}
          </Link>
        </p>
      </form>

      <div className="mt-8 space-y-4">
        <div className="relative flex items-center">
          <Separator className="flex-1" />
          <span className="text-muted-foreground px-3 text-xs font-semibold tracking-widest uppercase">
            {t('auth.orSignUpWith')}
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
