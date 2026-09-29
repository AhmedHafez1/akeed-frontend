'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { AkeedLogo } from './AkeedLogo'

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
  /**
   * `hero`: the dark brand gradient of sign-in and password pages.
   * `app`: the light app canvas signup shares with the onboarding steps that
   * follow it, so the account step looks like the start of setup.
   */
  surface?: 'hero' | 'app'
  className?: string
}

export function AuthFrame({
  children,
  surface = 'hero',
  className,
}: AuthFrameProps) {
  const pathname = usePathname() ?? ''
  const locale = getLocaleFromPathname(pathname)
  const isApp = surface === 'app'

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col',
        isApp ? 'akeed-app-canvas text-foreground' : 'auth-hero-surface'
      )}
    >
      <header
        className={cn(
          'flex shrink-0 items-center px-6',
          isApp ? 'justify-center pt-10 pb-2' : 'h-14'
        )}
      >
        <Link
          href={withLocale('/', locale)}
          className="focus-visible:ring-ring flex items-center rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none"
        >
          {isApp ? (
            <AkeedLogo className="h-10" />
          ) : (
            <Image
              src="/images/akeed-web-logo-horizontal-white.png"
              alt="Akeed"
              width={130}
              height={70}
              priority
              className="h-auto w-[120px] object-contain lg:w-[130px]"
            />
          )}
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-5 sm:px-6 sm:py-6">
        <div className={cn('w-full max-w-5xl', className)}>{children}</div>
      </main>
    </div>
  )
}
