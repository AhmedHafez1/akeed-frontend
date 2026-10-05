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
import { resolveOrganizationSourceMode } from '@/shared/config/commerceSources'
import { getLoginRedirectPath } from '@/shared/lib/authErrors'
import { createLogger } from '@/shared/lib/logger'
import { FullPageLoader } from '@/shared/layout/FullPageLoader'
import {
  clearKnownOnboardingSource,
  fetchOnboardingState,
  OnboardingApiError,
  rememberSignupSource,
} from '@/features/onboarding'

const logger = createLogger('AuthGuard')

interface AuthGuardProps {
  children: React.ReactNode
  requireOrganization?: boolean
  loadingFallback?: React.ReactNode
}

export function AuthGuard({
  children,
  requireOrganization = true,
  loadingFallback,
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
          clearKnownOnboardingSource()
          router.replace(getLoginRedirectPath(locale, window.location))
          return
        }

        if (
          activeUserIdRef.current &&
          activeUserIdRef.current !== session.user.id
        ) {
          clearStandaloneOrganizationBootstrap()
          clearKnownOnboardingSource()
        }
        activeUserIdRef.current = session.user.id

        if (requireOrganization) {
          await ensureStandaloneOrganization(session.user)
          const routeWithoutLocale = `/${(pathname ?? '')
            .split('/')
            .slice(2)
            .join('/')}`
          const isOnboardingRoute = routeWithoutLocale.startsWith('/onboarding')
          const state = await fetchOnboardingState().then(
            (response) => response.state,
            (error: unknown) => {
              // An organization that chose at signup to connect a store
              // platform has no source until that install finishes. Setup is
              // where it connects, so it is the only place it may be.
              if (
                error instanceof OnboardingApiError &&
                error.code === 'ONBOARDING_SOURCE_MISSING' &&
                resolveOrganizationSourceMode(
                  session.user.user_metadata?.signup_source
                ) === 'connect'
              ) {
                // Setup mounts the skin of the platform chosen at signup.
                rememberSignupSource(session.user.user_metadata?.signup_source)
                return null
              }
              throw error
            }
          )
          if (!active) return
          if (!state) {
            if (!isOnboardingRoute) {
              router.replace(`/${locale}/onboarding`)
              return
            }
            setAuthChecked(true)
            return
          }
          if (state.onboardingStatus === 'pending' && !isOnboardingRoute) {
            router.replace(`/${locale}/onboarding`)
            return
          }
          if (state.onboardingStatus === 'completed' && isOnboardingRoute) {
            // A finished account whose source still needs something (a
            // reconnect, new webhook secrets) is sent to where it is fixed.
            // This is also where the source's own redirect lands, so what
            // the source added to the address goes along: the connection
            // panel reads it there.
            if ((state.sourceSetup?.blockedReasons.length ?? 0) > 0) {
              const carried = new URLSearchParams(window.location.search)
              carried.set('tab', 'store')
              router.replace(`/${locale}/settings?${carried.toString()}`)
            } else {
              router.replace(auth.getDashboardPath(locale))
            }
            return
          }
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
        clearKnownOnboardingSource()
        router.replace(getLoginRedirectPath(locale, window.location))
        return
      }

      if (
        session &&
        activeUserIdRef.current &&
        activeUserIdRef.current !== session.user.id
      ) {
        activeUserIdRef.current = session.user.id
        clearStandaloneOrganizationBootstrap()
        clearKnownOnboardingSource()
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
      <main className="bg-muted flex min-h-screen items-center justify-center px-4">
        <div
          role="alert"
          className="rounded-card bg-card border-destructive-border w-full max-w-md border p-6 text-center"
        >
          <h1 className="text-foreground text-xl font-bold">
            {t('organizationSetupFailedTitle')}
          </h1>
          <p className="text-foreground/70 mt-2 text-sm">
            {t('organizationSetupFailedMessage')}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring/40 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t('retryOrganizationSetup')}
            </button>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="border-border bg-card text-foreground/80 hover:bg-muted/50 focus-visible:ring-ring/40 rounded-xl border px-5 py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t('signOut')}
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!isPublic && !authChecked) {
    return loadingFallback ?? <FullPageLoader />
  }

  return <>{children}</>
}
