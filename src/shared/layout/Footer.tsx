'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'

const footerLinks = [
  { href: '/', labelKey: 'home' },
  { href: '/support', labelKey: 'support' },
  { href: '/privacy', labelKey: 'privacy' },
  { href: '/terms', labelKey: 'terms' },
] as const

export function Footer() {
  const t = useTranslations('footer')
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200/80 bg-white px-4 pt-10 pb-28 text-slate-600 sm:px-6 md:pt-12 md:pb-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] lg:grid-cols-[1.2fr_0.7fr_0.9fr] lg:items-start">
          <div className="flex max-w-xl flex-col items-center text-center md:items-start md:text-start">
            <Link href={withLocale('/', locale)} className="inline-flex">
              <Image
                src="/images/akeed-web-logo-horizontal.png"
                alt={t('logoAlt')}
                width={170}
                height={70}
                className="h-auto w-36 object-contain md:w-40"
              />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              {t('legalLine')}
            </p>
          </div>

          <nav
            aria-label={t('navigationLabel')}
            className="flex flex-col items-center gap-3 text-center md:items-start md:text-start"
          >
            <p className="text-xs font-bold tracking-normal text-slate-400 uppercase">
              {t('navigationTitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 md:flex-col md:items-start md:gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={withLocale(link.href, locale)}
                  className="text-sm font-semibold text-slate-700 transition-colors hover:text-emerald-600"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          </nav>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-center md:col-span-2 lg:col-span-1 lg:text-start">
            <p className="text-sm font-bold text-slate-900">{t('ctaTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t('ctaDescription')}
            </p>
            <Link
              href={withLocale('/signup', locale)}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-700"
            >
              {t('ctaLabel')}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-6 text-center md:flex-row md:text-start">
          <p className="text-sm text-slate-500">{t('copyright', { year })}</p>
          <p className="text-xs font-medium text-slate-400">
            {t('madeForMerchants')}
          </p>
        </div>
      </div>
    </footer>
  )
}
