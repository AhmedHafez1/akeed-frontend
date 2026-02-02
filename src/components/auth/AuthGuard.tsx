'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/auth'

const PUBLIC_ROUTES = ['/login', '/signup', '/onboarding']

function isPublicRoute(pathname: string): boolean {
  const withoutLocale = '/' + pathname.split('/').slice(2).join('/')
  return PUBLIC_ROUTES.some((route) => withoutLocale.startsWith(route))
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = isPublicRoute(pathname)

  // Only needed for standalone + protected routes
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (isPublic) return

    let active = true

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) return

      if (!session) {
        const locale = pathname.split('/')[1]
        router.push(`/${locale}/login`)
        return
      }

      setAuthChecked(true)
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        const locale = pathname.split('/')[1]
        router.push(`/${locale}/login`)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [isPublic, pathname, router])

  const isReady = isPublic || authChecked

  if (!isReady) return null

  return <>{children}</>
}
