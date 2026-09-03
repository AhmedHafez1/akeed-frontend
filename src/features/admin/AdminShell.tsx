'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, LogOut, Store, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { auth } from '@/shared/lib/auth'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, isRTL } = useLocaleInfo()
  const t = useTranslations('adminCommon')
  const navigation = [
    { href: `/${locale}/admin/stores`, label: t('stores'), icon: Store },
    { href: `/${locale}/admin/funnel`, label: t('funnel'), icon: BarChart3 },
    {
      href: `/${locale}/admin/standalone-pilots`,
      label: t('pilots'),
      icon: Users,
    },
  ]

  const signOut = async () => {
    await auth.signOut()
    router.push(`/${locale}/login`)
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-950"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:flex-nowrap sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/admin/stores`}
            className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm shadow-emerald-700/20">
              A
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">
                {t('title')}
              </span>
              <span className="block text-[11px] leading-4 text-slate-500">
                {t('subtitle')}
              </span>
            </span>
          </Link>
          <nav
            className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-slate-100 pt-2 sm:order-none sm:w-auto sm:flex-1 sm:border-0 sm:pt-0"
            aria-label={t('navigation')}
          >
            {navigation.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none',
                    active
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto text-slate-600"
            onClick={signOut}
            aria-label={t('signOut')}
          >
            <LogOut className="size-4" />
            <span className="hidden md:inline">{t('signOut')}</span>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
