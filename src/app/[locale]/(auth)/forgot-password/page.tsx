'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/shared/lib/auth'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { useTranslations } from 'next-intl'

/**
 * Forgot Password Page - Standalone Mode Only
 *
 * Allows users to request a password reset link via Supabase.
 */

export default function ForgotPasswordPage() {
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
        console.error('[Auth] Password reset error:', resetError)
        setError(t('auth.resetLinkFailed'))
      } else {
        setSuccess(true)
      }
    } catch (err) {
      console.error('[Auth] Password reset failed:', err)
      setError(t('auth.resetLinkFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">
          {t('auth.forgotPasswordTitle')}
        </h1>
        <p className="text-sm text-slate-600">
          {t('auth.forgotPasswordSubtitle')}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {success ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {t('auth.resetLinkSent')}
            </div>
            <Link
              href={withLocale('/login', locale)}
              className="inline-flex text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
            >
              {t('auth.backToSignIn')}
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

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
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
                  placeholder={t('auth.email')}
                />
              </div>
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
              {isLoading
                ? t('auth.sendingResetLink')
                : t('auth.sendResetLink')}
            </button>

            <div className="text-center">
              <Link
                href={withLocale('/login', locale)}
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                {t('auth.backToSignIn')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
