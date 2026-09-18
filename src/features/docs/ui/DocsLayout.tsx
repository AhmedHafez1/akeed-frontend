'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DocsLayoutProps {
  sidebar: ReactNode
  mobileSidebar?: ReactNode
  children: ReactNode
}

export function DocsLayout({
  sidebar,
  mobileSidebar,
  children,
}: DocsLayoutProps) {
  const t = useTranslations('docs')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="hover:text-primary-hover border-border bg-card text-foreground/80 hover:border-input inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition-all"
        >
          <Menu className="h-4 w-4" />
          {t('openContents')}
        </button>
      </div>

      <div className="hidden lg:block">
        <div className="lg:sticky lg:top-24">{sidebar}</div>
      </div>

      <div className="min-w-0">{children}</div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={t('closeContents')}
          />
          <div className="border-border bg-card absolute inset-y-0 start-0 w-[86vw] max-w-sm overflow-y-auto border-e p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-foreground/80 text-sm font-bold tracking-wide uppercase">
                {t('sidebarTitle')}
              </p>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="border-border text-foreground/70 hover:bg-muted/50 inline-flex h-9 w-9 items-center justify-center rounded-lg border"
                aria-label={t('closeContents')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {mobileSidebar ?? sidebar}
          </div>
        </div>
      ) : null}
    </div>
  )
}
