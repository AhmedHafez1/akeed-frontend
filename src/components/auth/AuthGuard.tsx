'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { auth, getSupabaseClient } from '@/lib/auth'
import { isAuthRoute, getLocaleFromPathname } from '@/lib/locale'
import { FullPageLoader } from '@/components/layout/FullPageLoader'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isPublic = isAuthRoute(pathname)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Skip auth check for public routes
    if (isPublic) {
      return
    }

    let active = true
    const locale = getLocaleFromPathname(pathname ?? '')
    const supabase = getSupabaseClient()

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) return

      if (!session) {
        router.push(auth.getLoginPath(locale))
        return
      }

      setAuthChecked(true)
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublic) {
        router.push(auth.getLoginPath(locale))
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [isPublic, pathname, router])

  // Show loading state while checking auth (only for protected routes)
  if (!isPublic && !authChecked) {
    return <FullPageLoader />
  }

  return <>{children}</>
}
