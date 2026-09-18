'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CircleHelp, LogOut } from 'lucide-react'
import { auth } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import {
  getLocaleFromPathname,
  persistLocalePreference,
  withLocale,
} from '@/shared/lib/locale'
import type { SupportedLocale } from '@/shared/lib/locale'
import { AkeedLogo } from './AkeedLogo'

const logger = createLogger('Auth')

interface StandaloneOnboardingShellProps {
  children: ReactNode
}

/**
 * Focused shell for standalone setup.
 *
 * While onboarding is incomplete every protected destination redirects back
 * here, so the full sidebar shell is replaced by a slim bar carrying only the
 * three things a merchant needs mid-setup: the Akeed mark, the language
 * switch, and Help. The logo is deliberately not a link.
 */
export function StandaloneOnboardingShell({
  children,
}: StandaloneOnboardingShellProps) {
  const t = useTranslations('standaloneOnboarding')
  const tHeader = useTranslations('appHeader')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await auth.signOut()
      router.push(auth.getLoginPath(locale))
    } catch (error) {
      logger.error('Sign out failed', error)
      setIsSigningOut(false)
    }
  }

  const handleLocaleChange = () => {
    const nextLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar'
    persistLocalePreference(nextLocale)
    const segments = pathname.split('/')
    if (segments.length > 1) {
      segments[1] = nextLocale
      router.push(segments.join('/') || '/')
    }
  }

  return (
    <div className="akeed-app-canvas text-foreground flex min-h-screen flex-col">
      <a
        href="#onboarding-content"
        className="focus:bg-card focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:ring-2"
      >
        {t('shell.skipToContent')}
      </a>

      <header className="border-border bg-card flex min-h-14 items-center justify-between gap-3 border-b px-4 sm:px-6">
        <AkeedLogo className="h-9" />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleLocaleChange}
            className="border-border hover:bg-muted bg-card text-foreground/80 focus-visible:ring-ring inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            suppressHydrationWarning
          >
            {locale === 'ar' ? 'EN' : 'العربية'}
          </button>
          <Link
            href={withLocale('/support', locale)}
            target="_blank"
            rel="noreferrer"
            className="hover:bg-muted text-foreground/70 hover:text-foreground focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <CircleHelp aria-hidden="true" className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">{t('shell.help')}</span>
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="hover:bg-muted text-foreground/70 hover:text-destructive focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
          >
            <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">
              {isSigningOut ? tHeader('signingOut') : tHeader('signOut')}
            </span>
          </button>
        </div>
      </header>

      <main
        id="onboarding-content"
        className="flex-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {children}
      </main>
    </div>
  )
}
