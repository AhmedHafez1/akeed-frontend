'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Globe, LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { auth } from '@/shared/lib/auth'
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
  const t = useTranslations('appHeader')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)
  const [isSigningOut, setIsSigningOut] = useState(false)

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
    } catch (err) {
      console.error('[Auth] Sign out failed:', err)
      setIsSigningOut(false)
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link
            href={withLocale('/dashboard', locale)}
            className="flex items-center"
          >
            <Image
              src="/images/akeed-web-logo-horizontal.png"
              alt="Akeed"
              width={48}
              height={48}
              className="object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href={withLocale('/dashboard', locale)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {t('dashboard')}
            </Link>
            <Link
              href={withLocale('/verifications', locale)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {t('verifications')}
            </Link>
            <Link
              href={withLocale('/settings', locale)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {t('settings')}
            </Link>
            <Link
              href={withLocale('/message-preview', locale)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {t('messagePreview')}
            </Link>
            <Link
              href={withLocale('/automation-settings', locale)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {t('automationSettings')}
            </Link>
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
    </header>
  )
}
