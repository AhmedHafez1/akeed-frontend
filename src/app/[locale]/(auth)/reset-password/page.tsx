'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { useTranslations } from 'next-intl'

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
  const isRtl = locale === 'ar'

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
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {t('auth.resetPasswordTitle')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('auth.resetPasswordProcessing')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {t('auth.resetPasswordTitle')}
        </h1>
        <p className="text-sm text-slate-600">
          {t('auth.resetPasswordSubtitle')}
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md">
        {success ? (
          <div className="space-y-4">
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {t('auth.resetPasswordSuccess')}
            </div>
            <Link
              href={withLocale('/login', locale)}
              className="inline-flex text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700 focus-visible:underline focus-visible:outline-none"
            >
              {t('auth.backToSignIn')}
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                {t('auth.newPassword')}
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
                  placeholder={t('auth.newPassword')}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {t('auth.passwordRequirement')}
              </p>
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
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
                  placeholder={t('auth.confirmPassword')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition-all hover:bg-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-70"
            >
              {isLoading && (
                <svg
                  className={`absolute ${isRtl ? 'right-4' : 'left-4'} h-4 w-4 animate-spin`}
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
                ? t('auth.resettingPassword')
                : t('auth.resetPassword')}
            </button>

            <div className="text-center">
              <Link
                href={withLocale('/login', locale)}
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-emerald-700 focus-visible:underline focus-visible:outline-none"
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
