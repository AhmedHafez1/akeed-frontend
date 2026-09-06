'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Globe, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTranslations } from 'next-intl'
import { auth } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import {
  getLocaleFromPathname,
  withLocale,
  persistLocalePreference,
} from '@/shared/lib/locale'
import type { SupportedLocale } from '@/shared/lib/locale'

/**
 * App Header for authenticated standalone pages.
 *
 * Shows logo, dashboard nav, locale toggle, and sign-out.
 * This replaces the marketing Header on protected routes.
 */
export function AppHeader() {
  const logger = createLogger('Auth')
  const t = useTranslations('appHeader')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false)

  const navigationItems = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/verifications', label: t('verifications') },
    { href: '/settings', label: t('settings') },
    { href: '/templates', label: t('templates') },
  ]

  const isActivePath = (href: string) => pathname === withLocale(href, locale)

  const navigationLinkClassName = (isActive: boolean) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
      isActive
        ? 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    )

  const handleLocaleChange = () => {
    const newLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar'
    persistLocalePreference(newLocale)
    const segments = pathname.split('/')
    if (segments.length > 1) {
      segments[1] = newLocale
      const newPath = segments.join('/') || '/'
      router.push(newPath)
    }
  }

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

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex min-h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link
            href={withLocale('/dashboard', locale)}
            className="flex items-center"
          >
            <Image
              src="/images/akeed-web-logo-horizontal.png"
              alt="Akeed"
              width={118}
              height={50}
              className="h-9 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.href)
              return (
                <Link
                  key={item.href}
                  href={withLocale(item.href, locale)}
                  aria-current={isActive ? 'page' : undefined}
                  className={navigationLinkClassName(isActive)}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right: Locale + Sign Out */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLocaleChange}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            suppressHydrationWarning
          >
            <Globe className="h-4 w-4" />
            <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileNavigationOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:hidden"
            aria-label={t('navigationMenu')}
            aria-expanded={isMobileNavigationOpen}
          >
            {isMobileNavigationOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isSigningOut ? t('signingOut') : t('signOut')}
            </span>
          </button>
        </div>
      </div>
      {isMobileNavigationOpen && (
        <nav
          aria-label={t('primaryNavigation')}
          className="border-t border-slate-100 px-4 py-3 sm:hidden"
        >
          <div className="grid gap-1">
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.href)
              return (
                <Link
                  key={item.href}
                  href={withLocale(item.href, locale)}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setIsMobileNavigationOpen(false)}
                  className={navigationLinkClassName(isActive)}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
