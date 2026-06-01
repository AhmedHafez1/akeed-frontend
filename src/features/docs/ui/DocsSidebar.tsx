'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import type { DocNavItem } from '@/features/docs/model/docs.model'

interface DocsSidebarProps {
  items: DocNavItem[]
  activeSlug?: string
  onNavigate?: () => void
  showTitle?: boolean
}

export function DocsSidebar({
  items,
  activeSlug,
  onNavigate,
  showTitle = true,
}: DocsSidebarProps) {
  const t = useTranslations('docs')

  return (
    <aside className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      {showTitle ? (
        <h2 className="px-2 text-sm font-bold tracking-wide text-slate-700 uppercase">
          {t('sidebarTitle')}
        </h2>
      ) : null}
      <nav className="mt-3" aria-label={t('sidebarTitle')}>
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = item.slug === activeSlug

            return (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'block rounded-xl px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
