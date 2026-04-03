'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/shared/lib/auth'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { useTranslations } from 'next-intl'

/**
 * Signup Page - Standalone Mode Only
 *
 * For new users who want to try Akeed without Shopify
 * Allows connection to multiple platforms later
 */

export default function SignupPage() {
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
      await auth.signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        company_name: formData.companyName,
      })

      // Redirect to standalone dashboard
      router.push(auth.getDashboardPath(locale))
    } catch {
      setError(t('auth.signUpFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">
          {t('auth.createAccount')}
        </h1>
        <p className="text-sm text-slate-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link
            href={auth.getLoginPath(locale)}
            className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            {t('auth.signIn')}
          </Link>
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-slate-700"
              >
                {t('auth.fullName')}
              </label>
              <div className="relative mt-2">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
                  placeholder={t('auth.fullName')}
                />
                {formData.fullName ? (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-500">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0L3.293 9.848a1 1 0 011.414-1.414l4.102 4.102 6.364-6.364a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                {t('auth.email')}
              </label>
              <div className="relative mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
                  placeholder={t('auth.email')}
                />
                {formData.email ? (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-500">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0L3.293 9.848a1 1 0 011.414-1.414l4.102 4.102 6.364-6.364a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                {t('auth.password')}
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    fieldErrors.password
                      ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-500/40'
                      : 'border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/40'
                  }`}
                  placeholder={t('auth.password')}
                />
                {fieldErrors.password ? (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-red-500">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : formData.password ? (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-500">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0L3.293 9.848a1 1 0 011.414-1.414l4.102 4.102 6.364-6.364a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {t('auth.passwordRequirement')}
              </p>
              {fieldErrors.password && (
                <p className="mt-2 text-xs text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-700"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="relative mt-2">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    fieldErrors.confirmPassword
                      ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-500/40'
                      : 'border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/40'
                  }`}
                  placeholder={t('auth.confirmPassword')}
                />
                {fieldErrors.confirmPassword ? (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-red-500">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : formData.confirmPassword ? (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-500">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0L3.293 9.848a1 1 0 011.414-1.414l4.102 4.102 6.364-6.364a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : null}
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-2 text-xs text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
            <span>
              {t('auth.agreeToTerms')}{' '}
              <Link
                href={withLocale('/terms', locale)}
                className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                target="_blank"
              >
                {t('auth.termsOfService')}
              </Link>{' '}
              {t('auth.and')}{' '}
              <Link
                href={withLocale('/privacy', locale)}
                className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                target="_blank"
              >
                {t('auth.privacyPolicy')}
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="relative flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-70"
          >
            {isLoading && (
              <svg
                className="absolute left-4 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {t('auth.createAccount')}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs tracking-widest text-slate-400 uppercase">
            <span className="bg-slate-50 px-2">{t('auth.orSignUpWith')}</span>
          </div>
        </div>

        <Link
          href="/api/auth/shopify"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.337 2.167c-.026-.028-.057-.05-.089-.066a.397.397 0 0 0-.134-.027c-.05 0-.1.01-.145.027l-.91.33s-1.238-1.27-2.743-1.27c-.064 0-.13.004-.196.01-.027-.027-.055-.05-.088-.072C10.48.726 9.844.5 9.046.5c-2.096 0-3.104 2.621-3.428 3.95-.91.281-1.547.477-1.624.505-.478.15-.493.164-.555.605C3.384 5.89 2 16.983 2 16.983l11.031 2.034 6.03-1.35S15.363 2.195 15.337 2.167zm-2.644.536c-.626.192-1.318.405-2.025.622 0-.002.195-1.617-.706-2.411.89.224 1.746.964 2.73 1.789zm-1.644.505l-2.558.787c.248-.94.723-1.866 1.287-2.345.218-.184.513-.395.839-.556.582.643.432 1.65.432 2.114zm-1.163-3.19c.183 0 .35.03.506.085-.304.17-.615.4-.883.634-.687.596-1.364 1.693-1.625 3.187l-2.008.62c.38-1.457 1.473-4.525 4.01-4.525z" />
          </svg>
          {t('auth.continueWithShopify')}
        </Link>
      </div>
    </div>
  )
}
