'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { auth } from '@/shared/lib/auth'
import { createLogger } from '@/shared/lib/logger'
import { cn } from '@/shared/lib/utils'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { useStandaloneShell } from './StandaloneShellContext'

const logger = createLogger('Auth')

interface StandaloneSidebarProps {
  className?: string
  onNavigate?: () => void
}

export function StandaloneSidebar({
  className,
  onNavigate,
}: StandaloneSidebarProps) {
  const t = useTranslations('appHeader')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)
  const { identity, isIdentityLoading } = useStandaloneShell()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const navigationItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/verifications', label: t('verifications'), icon: ShieldCheck },
    { href: '/templates', label: t('templates'), icon: FileText },
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
        'flex h-full w-[248px] shrink-0 flex-col border-e border-stone-200 bg-white px-4 py-5',
        className
      )}
    >
      <Link
        href={withLocale('/dashboard', locale)}
        onClick={onNavigate}
        className="inline-flex w-fit rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Image
          src="/images/akeed-web-logo-horizontal.png"
          alt="Akeed"
          width={118}
          height={50}
          priority
          className="h-10 w-auto object-contain"
        />
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
                'flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none',
                isActive
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-stone-50 hover:text-slate-950'
              )}
            >
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-8">
        <Link
          href={withLocale('/support', locale)}
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-stone-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <CircleHelp aria-hidden="true" className="h-5 w-5" />
          {t('helpSupport')}
        </Link>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-800">
              {workspaceName.slice(0, 1).toLocaleUpperCase(locale)}
            </div>
            <div className="min-w-0 flex-1">
              {isIdentityLoading ? (
                <div className="space-y-2" aria-label={t('identityLoading')}>
                  <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
                  <div className="h-2.5 w-28 animate-pulse rounded bg-stone-200" />
                </div>
              ) : (
                <>
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {workspaceName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
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
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            {isSigningOut ? t('signingOut') : t('signOut')}
          </button>
        </div>
      </div>
    </aside>
  )
}
