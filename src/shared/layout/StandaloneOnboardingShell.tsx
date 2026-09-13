'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CircleHelp } from 'lucide-react'
import {
  getLocaleFromPathname,
  persistLocalePreference,
  withLocale,
} from '@/shared/lib/locale'
import type { SupportedLocale } from '@/shared/lib/locale'

interface StandaloneOnboardingShellProps {
  children: ReactNode
}

/**
 * Focused shell for standalone setup.
 *
 * While onboarding is incomplete every protected destination redirects back
 * here, so the full sidebar shell is replaced by a slim bar carrying only the
 * three things a merchant needs mid-setup: the Akeed mark, the language
 * switch, and Help. The logo is deliberately not a link.
 */
export function StandaloneOnboardingShell({
  children,
}: StandaloneOnboardingShellProps) {
  const t = useTranslations('standaloneOnboarding')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)

  const handleLocaleChange = () => {
    const nextLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar'
    persistLocalePreference(nextLocale)
    const segments = pathname.split('/')
    if (segments.length > 1) {
      segments[1] = nextLocale
      router.push(segments.join('/') || '/')
    }
  }

  return (
    <div className="akeed-app-canvas flex min-h-screen flex-col text-slate-950">
      <a
        href="#onboarding-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:ring-2 focus:ring-emerald-600"
      >
        {t('shell.skipToContent')}
      </a>

      <header className="border-border flex min-h-14 items-center justify-between gap-3 border-b bg-white px-4 sm:px-6">
        <Image
          src="/images/akeed-web-logo-horizontal.png"
          alt="Akeed"
          width={118}
          height={50}
          priority
          className="h-9 w-auto object-contain"
        />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleLocaleChange}
            className="border-border hover:bg-muted inline-flex h-9 items-center rounded-lg border bg-white px-3 text-xs font-semibold text-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
            suppressHydrationWarning
          >
            {locale === 'ar' ? 'EN' : 'العربية'}
          </button>
          <Link
            href={withLocale('/support', locale)}
            target="_blank"
            rel="noreferrer"
            className="hover:bg-muted inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-slate-600 transition-colors hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <CircleHelp aria-hidden="true" className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">{t('shell.help')}</span>
          </Link>
        </div>
      </header>

      <main
        id="onboarding-content"
        className="flex-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {children}
      </main>
    </div>
  )
}
