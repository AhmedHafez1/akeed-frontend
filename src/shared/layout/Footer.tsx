'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'

const footerLinks = [
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
    <footer className="border-t border-slate-200 bg-slate-50/90 px-6 pt-10 pb-28 text-slate-600 md:pt-12 md:pb-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 text-center md:flex-row md:text-start">
        <div className="flex max-w-xl flex-col items-center gap-4 md:items-start">
          <Image
            src="/images/akeed-web-logo-horizontal.png"
            alt={t('logoAlt')}
            width={170}
            height={70}
            className="h-auto w-36 object-contain md:w-40"
          />
          <p className="text-base leading-relaxed text-slate-600">
            {t('legalLine')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 md:items-end">
          <nav
            aria-label={t('navigationLabel')}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={withLocale(link.href, locale)}
                className="text-base font-semibold text-slate-800 transition-colors hover:text-emerald-600"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
          <p className="text-base text-slate-500">{t('copyright', { year })}</p>
        </div>
      </div>
    </footer>
  )
}
