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
      href: `/${locale}/admin/standalone-billing`,
      label: t('billing'),
      icon: Users,
    },
  ]

  const signOut = async () => {
    await auth.signOut()
    router.push(`/${locale}/login`)
  }

  return (
    <div
      className="akeed-app-canvas text-foreground min-h-screen"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <header className="border-border bg-card/95 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:flex-nowrap sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/admin/stores`}
            className="focus-visible:ring-ring flex shrink-0 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-xl text-sm font-bold shadow-sm shadow-emerald-700/20">
              A
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">
                {t('title')}
              </span>
              <span className="text-muted-foreground block text-[11px] leading-4">
                {t('subtitle')}
              </span>
            </span>
          </Link>
          <nav
            className="border-border order-3 flex w-full items-center gap-1 overflow-x-auto border-t pt-2 sm:order-none sm:w-auto sm:flex-1 sm:border-0 sm:pt-0"
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
                    'focus-visible:ring-ring flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    active
                      ? 'bg-primary-subtle text-primary-subtle-foreground'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground'
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
            className="text-foreground/70 ms-auto"
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
