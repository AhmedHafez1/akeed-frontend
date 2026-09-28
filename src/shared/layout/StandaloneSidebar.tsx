'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  CircleHelp,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  ShieldCheck,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useBillingSummary } from '@/features/billing'
import { useIsAdmin } from '@/features/admin/useIsAdmin'
import { auth } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import { cn } from '@/shared/lib/utils'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { AkeedLogo } from './AkeedLogo'
import { useStandaloneShell } from './StandaloneShellContext'

const logger = createLogger('Auth')

interface StandaloneSidebarProps {
  className?: string
  onNavigate?: () => void
  /** Display controls the top bar has no room for (the phone menu). */
  preferences?: ReactNode
}

export function StandaloneSidebar({
  className,
  onNavigate,
  preferences,
}: StandaloneSidebarProps) {
  const t = useTranslations('appHeader')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)
  const { identity, isIdentityLoading } = useStandaloneShell()
  const { summary: billingSummary } = useBillingSummary()
  const isAdmin = useIsAdmin()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const navigationItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/verifications', label: t('verifications'), icon: ShieldCheck },
    { href: '/templates', label: t('templates'), icon: FileText },
    ...(billingSummary?.billingEnabled
      ? [{ href: '/billing', label: t('billing'), icon: CreditCard }]
      : []),
    { href: '/settings', label: t('settings'), icon: Settings },
  ]

  const isActivePath = (href: string) => {
    const localizedHref = withLocale(href, locale)
    return (
      pathname === localizedHref || pathname.startsWith(`${localizedHref}/`)
    )
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

  const workspaceName = identity.workspaceName ?? t('workspaceFallback')
  const userLabel = identity.fullName ?? identity.email ?? t('userFallback')

  return (
    <aside
      className={cn(
        'border-border bg-card flex h-full w-[248px] shrink-0 flex-col border-e px-4 py-5',
        className
      )}
    >
      <Link
        href={withLocale('/dashboard', locale)}
        onClick={onNavigate}
        className="focus-visible:ring-ring inline-flex w-fit rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <AkeedLogo className="h-10" />
      </Link>

      <nav aria-label={t('primaryNavigation')} className="mt-10 space-y-2">
        {navigationItems.map((item) => {
          const isActive = isActivePath(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={withLocale(item.href, locale)}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                isActive
                  ? 'bg-primary-subtle text-primary-subtle-foreground'
                  : 'hover:bg-muted text-foreground/70 hover:text-foreground'
              )}
            >
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-8">
        {preferences}
        {isAdmin && (
          <Link
            href={withLocale('/admin', locale)}
            onClick={onNavigate}
            className="hover:bg-muted text-foreground/70 hover:text-foreground focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Shield aria-hidden="true" className="h-5 w-5" />
            {t('admin')}
          </Link>
        )}
        <Link
          href={withLocale('/docs', locale)}
          onClick={onNavigate}
          className="hover:bg-muted text-foreground/70 hover:text-foreground focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <BookOpen aria-hidden="true" className="h-5 w-5" />
          {t('docs')}
        </Link>
        <Link
          href={withLocale('/support', locale)}
          onClick={onNavigate}
          className="hover:bg-muted text-foreground/70 hover:text-foreground focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <CircleHelp aria-hidden="true" className="h-5 w-5" />
          {t('helpSupport')}
        </Link>

        <div className="border-border bg-muted rounded-xl border p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="border-primary-border bg-primary-subtle text-primary-subtle-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold">
              {workspaceName.slice(0, 1).toLocaleUpperCase(locale)}
            </div>
            <div className="min-w-0 flex-1">
              {isIdentityLoading ? (
                <div className="space-y-2" aria-label={t('identityLoading')}>
                  <div className="bg-border h-3 w-24 animate-pulse rounded" />
                  <div className="bg-border h-2.5 w-28 animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <p className="text-foreground truncate text-sm font-semibold">
                    {workspaceName}
                  </p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {userLabel}
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="border-border bg-card text-foreground/70 hover:border-destructive-border hover:bg-destructive-subtle hover:text-destructive-subtle-foreground focus-visible:ring-destructive mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            {isSigningOut ? t('signingOut') : t('signOut')}
          </button>
        </div>
      </div>
    </aside>
  )
}
