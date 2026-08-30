'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  auth,
  clearStandaloneOrganizationBootstrap,
  ensureStandaloneOrganization,
  getSupabaseClient,
} from '@/shared/lib/auth'
import {
  isAuthRoute,
  isPublicRoute,
  getLocaleFromPathname,
} from '@/shared/lib/locale'
import { createLogger } from '@/shared/lib/logger'
import { FullPageLoader } from '@/shared/layout/FullPageLoader'

const logger = createLogger('AuthGuard')

interface AuthGuardProps {
  children: React.ReactNode
  requireOrganization?: boolean
}

export function AuthGuard({
  children,
  requireOrganization = true,
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('auth')
  const isPublic = isAuthRoute(pathname) || isPublicRoute(pathname)
  const [authChecked, setAuthChecked] = useState(false)
  const [bootstrapFailed, setBootstrapFailed] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const activeUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Skip auth check for public routes
    if (isPublic) {
      return
    }

    let active = true
    const locale = getLocaleFromPathname(pathname ?? '')
    const supabase = getSupabaseClient()

    const checkAuth = async () => {
      setBootstrapFailed(false)

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!active) return

        if (!session) {
          activeUserIdRef.current = null
          clearStandaloneOrganizationBootstrap()
          router.replace(auth.getLoginPath(locale))
          return
        }

        if (
          activeUserIdRef.current &&
          activeUserIdRef.current !== session.user.id
        ) {
          clearStandaloneOrganizationBootstrap()
        }
        activeUserIdRef.current = session.user.id

        if (requireOrganization) {
          await ensureStandaloneOrganization(session.user)
        }
        if (!active) return

        setAuthChecked(true)
      } catch (error) {
        logger.error('Failed to prepare standalone organization', error)
        if (!active) return

        setAuthChecked(false)
        setBootstrapFailed(true)
      }
    }

    void checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublic) {
        activeUserIdRef.current = null
        clearStandaloneOrganizationBootstrap()
        router.replace(auth.getLoginPath(locale))
        return
      }

      if (
        session &&
        activeUserIdRef.current &&
        activeUserIdRef.current !== session.user.id
      ) {
        activeUserIdRef.current = session.user.id
        clearStandaloneOrganizationBootstrap()
        setAuthChecked(false)
        setRetryKey((value) => value + 1)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [isPublic, pathname, requireOrganization, retryKey, router])

  const handleSignOut = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      logger.error('Failed to sign out after provisioning error', error)
    } finally {
      router.replace(auth.getLoginPath(getLocaleFromPathname(pathname ?? '')))
    }
  }

  // Show loading state while checking auth (only for protected routes)
  if (!isPublic && bootstrapFailed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div
          role="alert"
          className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm"
        >
          <h1 className="text-xl font-bold text-slate-900">
            {t('organizationSetupFailedTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {t('organizationSetupFailedMessage')}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t('retryOrganizationSetup')}
            </button>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t('signOut')}
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!isPublic && !authChecked) {
    return <FullPageLoader />
  }

  return <>{children}</>
}
