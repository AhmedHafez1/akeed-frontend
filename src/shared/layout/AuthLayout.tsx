'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { ThemeToggle } from '@/shared/theme'
import { AkeedLogo } from './AkeedLogo'
import { LocaleToggle } from './LocaleToggle'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * Auth routes share `AuthFrame`, except signup: after the form it becomes the
 * first onboarding step (verify email), which uses the onboarding shell, so
 * the signup page picks its own frame.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname() ?? ''
  const route = `/${pathname.split('/').slice(2).join('/')}`

  if (route === '/signup' || route.startsWith('/signup/')) {
    return <>{children}</>
  }

  return <AuthFrame>{children}</AuthFrame>
}

interface AuthFrameProps {
  children: ReactNode
  className?: string
}

/** Themed illustration backdrop, logo, and theme and language controls. */
export function AuthFrame({ children, className }: AuthFrameProps) {
  const pathname = usePathname() ?? ''
  const locale = getLocaleFromPathname(pathname)

  return (
    <div className="auth-surface text-foreground flex min-h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <Link
          href={withLocale('/', locale)}
          className="focus-visible:ring-ring flex items-center rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none"
        >
          <AkeedLogo className="h-9 sm:h-10" />
        </Link>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-5 sm:px-6 sm:py-6">
        <div className={cn('w-full max-w-5xl', className)}>{children}</div>
      </main>
    </div>
  )
}
