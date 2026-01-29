'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await auth.signIn(email, password)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch {
      setError('Failed to sign in!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Akeed</h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            {t('auth.signInToAccount')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.dontHaveAccount')}{' '}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t('auth.signUp')}
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                placeholder={t('auth.email')}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                placeholder={t('auth.password')}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                {t('auth.rememberMe')}
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </div>
        </form>

        {/* Shopify Login Link */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-2 text-gray-500">
              {t('auth.orContinueWith')}
            </span>
          </div>
        </div>

        <div>
          <Link
            href="/auth/shopify"
            className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              {/* Shopify icon */}
              <path d="M15.337 2.167c-.026-.028-.057-.05-.089-.066a.397.397 0 0 0-.134-.027c-.05 0-.1.01-.145.027l-.91.33s-1.238-1.27-2.743-1.27c-.064 0-.13.004-.196.01-.027-.027-.055-.05-.088-.072C10.48.726 9.844.5 9.046.5c-2.096 0-3.104 2.621-3.428 3.95-.91.281-1.547.477-1.624.505-.478.15-.493.164-.555.605C3.384 5.89 2 16.983 2 16.983l11.031 2.034 6.03-1.35S15.363 2.195 15.337 2.167zm-2.644.536c-.626.192-1.318.405-2.025.622 0-.002.195-1.617-.706-2.411.89.224 1.746.964 2.73 1.789zm-1.644.505l-2.558.787c.248-.94.723-1.866 1.287-2.345.218-.184.513-.395.839-.556.582.643.432 1.65.432 2.114zm-1.163-3.19c.183 0 .35.03.506.085-.304.17-.615.4-.883.634-.687.596-1.364 1.693-1.625 3.187l-2.008.62c.38-1.457 1.473-4.525 4.01-4.525z" />
            </svg>
            {t('auth.continueWithShopify')}
          </Link>
        </div>
      </div>
    </div>
  )
}
