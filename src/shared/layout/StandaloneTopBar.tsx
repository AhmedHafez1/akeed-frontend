'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, Globe, Menu, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ManualOrderTopBarAction } from '@/features/orders'
import {
  getLocaleFromPathname,
  persistLocalePreference,
  withLocale,
} from '@/shared/lib/locale'
import type { SupportedLocale } from '@/shared/lib/locale'
import { ThemeToggle } from '@/shared/theme'

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
    // An import is part of the confirmations page, not a page of its own.
    routeName === 'verifications' || routeName === 'imports'
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
    <header className="border-border bg-card/95 sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label={t('navigationMenu')}
          className="border-border hover:bg-muted text-foreground/80 focus-visible:ring-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <nav
          aria-label={t('breadcrumbs')}
          className="flex min-w-0 items-center gap-2 text-sm"
        >
          <span className="text-muted-foreground hidden sm:inline">
            {t('workspace')}
          </span>
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground hidden h-4 w-4 sm:block rtl:rotate-180"
          />
          <span className="text-foreground truncate font-semibold">
            {breadcrumbLabel}
          </span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ManualOrderTopBarAction />
        <Link
          href={withLocale('/verifications', locale)}
          aria-label={t('openVerifications')}
          className="hover:bg-muted text-foreground/70 hover:text-foreground focus-visible:ring-ring inline-flex h-10 w-10 items-center justify-center gap-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none xl:w-auto xl:px-3"
        >
          <ShieldCheck
            aria-hidden="true"
            className="h-[18px] w-[18px] shrink-0"
          />
          <span className="hidden xl:inline">{t('verifications')}</span>
        </Link>
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLocaleChange}
          aria-label={t('changeLocale')}
          className="border-border hover:bg-muted bg-card text-foreground/80 focus-visible:ring-ring inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto sm:px-3"
          suppressHydrationWarning
        >
          <Globe aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">
            {locale === 'ar' ? 'EN' : 'العربية'}
          </span>
        </button>
      </div>
    </header>
  )
}
