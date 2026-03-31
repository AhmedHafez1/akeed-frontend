'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/shared/lib/auth'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { useTranslations } from 'next-intl'

/**
 * Login Page - Standalone Mode Only
 *
 * This page is for users accessing app.akeed.com directly.
 * Shopify merchants will never see this - they use OAuth.
 */

export default function LoginPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const isRtl = locale === 'ar'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const hasError = Boolean(error)

  // Shopify OAuth state
  const [shopDomain, setShopDomain] = useState('')
  const [shopError, setShopError] = useState('')

  const handleShopifyConnect = () => {
    const trimmed = shopDomain.trim().toLowerCase()
    if (!trimmed) {
      setShopError(t('auth.shopifyStoreRequired'))
      return
    }
    setShopError('')
    // Normalize: strip .myshopify.com if user included it
    const normalized = trimmed.replace(/\.myshopify\.com$/i, '')
    const fullDomain = `${normalized}.myshopify.com`
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/shopify?shop=${encodeURIComponent(fullDomain)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await auth.signIn(email, password)

      // Redirect to dashboard
      router.push(auth.getDashboardPath(locale))
    } catch {
      setError(t('auth.signInFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">
          {t('auth.signInToAccount')}
        </h1>
        <p className="text-sm text-slate-600">
          {t('auth.dontHaveAccount')}{' '}
          <Link
            href={auth.getSignupPath(locale)}
            className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            {t('auth.signUp')}
          </Link>
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div
              id="auth-error"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby={hasError ? 'auth-error' : undefined}
                  className={`block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    hasError
                      ? 'border-red-300 focus-visible:border-red-400'
                      : 'border-slate-200 focus-visible:border-emerald-500'
                  }`}
                  placeholder={t('auth.email')}
                />
                {hasError ? (
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
                ) : email ? (
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={hasError ? 'auth-error' : undefined}
                  className={`block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    hasError
                      ? 'border-red-300 focus-visible:border-red-400'
                      : 'border-slate-200 focus-visible:border-emerald-500'
                  }`}
                  placeholder={t('auth.password')}
                />
                {hasError ? (
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
                ) : password ? (
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
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              />
              {t('auth.rememberMe')}
            </label>

            <Link
              href={withLocale('/forgot-password', locale)}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

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
            {t('auth.signIn')}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs tracking-widest text-slate-400 uppercase">
            <span className="bg-slate-50 px-2">{t('auth.orContinueWith')}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-[#96bf48]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.337 2.167c-.026-.028-.057-.05-.089-.066a.397.397 0 0 0-.134-.027c-.05 0-.1.01-.145.027l-.91.33s-1.238-1.27-2.743-1.27c-.064 0-.13.004-.196.01-.027-.027-.055-.05-.088-.072C10.48.726 9.844.5 9.046.5c-2.096 0-3.104 2.621-3.428 3.95-.91.281-1.547.477-1.624.505-.478.15-.493.164-.555.605C3.384 5.89 2 16.983 2 16.983l11.031 2.034 6.03-1.35S15.363 2.195 15.337 2.167zm-2.644.536c-.626.192-1.318.405-2.025.622 0-.002.195-1.617-.706-2.411.89.224 1.746.964 2.73 1.789zm-1.644.505l-2.558.787c.248-.94.723-1.866 1.287-2.345.218-.184.513-.395.839-.556.582.643.432 1.65.432 2.114zm-1.163-3.19c.183 0 .35.03.506.085-.304.17-.615.4-.883.634-.687.596-1.364 1.693-1.625 3.187l-2.008.62c.38-1.457 1.473-4.525 4.01-4.525z" />
            </svg>
            <span className="text-sm font-semibold text-slate-800">
              {t('auth.continueWithShopify')}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="shop-domain"
                className="text-sm font-medium text-slate-700"
              >
                {t('auth.shopifyStoreDomain')}
              </label>
              <div
                className={`relative mt-2 flex ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <input
                  id="shop-domain"
                  type="text"
                  value={shopDomain}
                  onChange={(e) => {
                    setShopDomain(e.target.value)
                    if (shopError) setShopError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleShopifyConnect()
                    }
                  }}
                  className={`block w-full border px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-0 focus-visible:outline-none ${
                    isRtl ? 'rounded-r-xl' : 'rounded-l-xl'
                  } ${
                    shopError
                      ? 'border-red-300 focus-visible:border-red-400'
                      : 'border-slate-200 focus-visible:border-emerald-500'
                  }`}
                  placeholder={t('auth.shopifyStorePlaceholder')}
                  dir="ltr"
                />
                <span
                  className={`inline-flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 ${
                    isRtl
                      ? 'rounded-l-xl border-r-0'
                      : 'rounded-r-xl border-l-0'
                  }`}
                >
                  {t('auth.shopifyStoreSuffix')}
                </span>
              </div>
              {shopError && (
                <p className="mt-1.5 text-xs text-red-600">{shopError}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleShopifyConnect}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#96bf48] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7ea93e] focus-visible:ring-2 focus-visible:ring-[#96bf48]/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.337 2.167c-.026-.028-.057-.05-.089-.066a.397.397 0 0 0-.134-.027c-.05 0-.1.01-.145.027l-.91.33s-1.238-1.27-2.743-1.27c-.064 0-.13.004-.196.01-.027-.027-.055-.05-.088-.072C10.48.726 9.844.5 9.046.5c-2.096 0-3.104 2.621-3.428 3.95-.91.281-1.547.477-1.624.505-.478.15-.493.164-.555.605C3.384 5.89 2 16.983 2 16.983l11.031 2.034 6.03-1.35S15.363 2.195 15.337 2.167zm-2.644.536c-.626.192-1.318.405-2.025.622 0-.002.195-1.617-.706-2.411.89.224 1.746.964 2.73 1.789zm-1.644.505l-2.558.787c.248-.94.723-1.866 1.287-2.345.218-.184.513-.395.839-.556.582.643.432 1.65.432 2.114zm-1.163-3.19c.183 0 .35.03.506.085-.304.17-.615.4-.883.634-.687.596-1.364 1.693-1.625 3.187l-2.008.62c.38-1.457 1.473-4.525 4.01-4.525z" />
              </svg>
              {t('auth.connectShopify')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
