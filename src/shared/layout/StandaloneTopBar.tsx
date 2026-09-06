'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronRight, Menu, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  getLocaleFromPathname,
  persistLocalePreference,
  withLocale,
} from '@/shared/lib/locale'
import type { SupportedLocale } from '@/shared/lib/locale'

interface StandaloneTopBarProps {
  onOpenNavigation: () => void
}

export function StandaloneTopBar({ onOpenNavigation }: StandaloneTopBarProps) {
  const t = useTranslations('appHeader')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)
  const routeName = pathname.split('/')[2] ?? 'dashboard'
  const breadcrumbLabel =
    routeName === 'verifications'
      ? t('verifications')
      : routeName === 'templates'
        ? t('templates')
        : routeName === 'settings'
          ? t('settings')
          : t('dashboard')

  const handleLocaleChange = () => {
    const newLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar'
    persistLocalePreference(newLocale)
    const segments = pathname.split('/')
    if (segments.length > 1) {
      segments[1] = newLocale
      router.push(segments.join('/') || '/')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-stone-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label={t('navigationMenu')}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-slate-700 transition-colors hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <nav
          aria-label={t('breadcrumbs')}
          className="flex min-w-0 items-center gap-2 text-sm"
        >
          <span className="hidden text-slate-500 sm:inline">
            {t('workspace')}
          </span>
          <ChevronRight
            aria-hidden="true"
            className="hidden h-4 w-4 text-stone-300 sm:block rtl:rotate-180"
          />
          <span className="truncate font-semibold text-slate-950">
            {breadcrumbLabel}
          </span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Link
          href={withLocale('/verifications', locale)}
          aria-label={t('searchOrders')}
          className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-slate-600 transition-colors hover:bg-stone-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Search aria-hidden="true" className="h-[18px] w-[18px]" />
          <span className="hidden xl:inline">{t('search')}</span>
        </Link>
        <span
          role="img"
          aria-label={t('notifications')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600"
        >
          <Bell aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <button
          type="button"
          onClick={handleLocaleChange}
          className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          suppressHydrationWarning
        >
          {locale === 'ar' ? 'EN' : 'العربية'}
        </button>
      </div>
    </header>
  )
}
