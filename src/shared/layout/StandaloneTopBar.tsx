'use client'

import { usePathname } from 'next/navigation'
import { ChevronRight, Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  ImportProgressChip,
  ImportTopBarAction,
} from '@/features/order-imports'
import { ManualOrderTopBarAction } from '@/features/orders'
import { ThemeToggle } from '@/shared/theme'
import { LocaleToggle } from './LocaleToggle'

interface StandaloneTopBarProps {
  onOpenNavigation: () => void
}

/**
 * Breadcrumb on the start; a started import's progress, the two order actions
 * and the display controls on the end. Below 640px the actions are 44px icons and theme and language move
 * into the navigation menu.
 */
export function StandaloneTopBar({ onOpenNavigation }: StandaloneTopBarProps) {
  const t = useTranslations('appHeader')
  const pathname = usePathname() ?? ''
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

  return (
    <header className="border-border bg-card/95 sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label={t('navigationMenu')}
          className="border-border hover:bg-muted text-foreground/80 focus-visible:ring-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:h-10 sm:w-10 lg:hidden"
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

      <div className="flex shrink-0 items-center gap-2">
        <ImportProgressChip />
        <ImportTopBarAction />
        <ManualOrderTopBarAction />
        <span
          aria-hidden="true"
          className="bg-border mx-1 hidden h-6 w-px sm:block"
        />
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <LocaleToggle />
        </div>
      </div>
    </header>
  )
}
