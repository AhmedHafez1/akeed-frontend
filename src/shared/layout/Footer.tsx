'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Instagram, Youtube } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'

const footerLinkGroups = [
  {
    titleKey: 'navigationTitle',
    links: [
      { href: '/', labelKey: 'home' },
      { href: '/#solution', labelKey: 'features' },
      { href: '/#pricing', labelKey: 'pricing' },
    ],
  },
  {
    titleKey: 'supportTitle',
    links: [
      { href: '/support', labelKey: 'helpCenter' },
      { href: '/support', labelKey: 'contactUs' },
      { href: '/support', labelKey: 'community' },
    ],
  },
  {
    titleKey: 'legalTitle',
    links: [
      { href: '/privacy', labelKey: 'privacyPolicy' },
      { href: '/terms', labelKey: 'termsOfService' },
      { href: '/privacy', labelKey: 'security' },
    ],
  },
] as const

const socialLinks = [
  { href: 'https://facebook.com', labelKey: 'facebook', icon: 'facebook' },
  { href: 'https://youtube.com', labelKey: 'youtube', icon: 'youtube' },
  { href: 'https://instagram.com', labelKey: 'instagram', icon: 'instagram' },
] as const

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M14.2 8.2V6.7c0-.8.5-1 1-1h2.6V1.3L14.3 1c-3.5 0-5.4 2.1-5.4 5.9v1.3H5.2v4.9h3.7V23h5.1v-9.9h3.7l.7-4.9h-4.2Z" />
    </svg>
  )
}

export function Footer() {
  const t = useTranslations('footer')
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const year = new Date().getFullYear()

  return (
    // gradient background
    <footer className="bg-linear-to-b from-slate-100 to-white text-slate-600">
      <div className="mx-auto max-w-410 rounded-3xl px-6 py-10">
        <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
          <div className="flex flex-col items-center justify-center md:items-start md:justify-start md:text-start">
            <Link href={withLocale('/', locale)}>
              <Image
                src="/images/akeed-web-logo-horizontal.png"
                alt={t('logoAlt')}
                width={110}
                height={80}
                className="object-contain"
              />
            </Link>
            <p className="md:text-md mt-1 max-w-xl text-sm leading-8 text-slate-500">
              {t('legalLine')}
            </p>

            <div className="mt-10 flex items-center gap-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.labelKey}
                  href={social.href}
                  aria-label={t(social.labelKey)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition-colors hover:border-emerald-200 hover:text-emerald-600"
                >
                  {social.icon === 'facebook' ? (
                    <FacebookIcon className="h-5 w-5" />
                  ) : social.icon === 'youtube' ? (
                    <Youtube className="h-5 w-5" />
                  ) : (
                    <Instagram className="h-5 w-5" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <nav
            aria-label={t('navigationLabel')}
            className="flex w-full flex-row-reverse justify-center gap-8 md:gap-20 md:text-left lg:justify-start lg:gap-32"
          >
            {footerLinkGroups.map((group) => (
              <div key={group.titleKey}>
                <p className="md:text-md text-center text-sm font-bold text-slate-950">
                  {t(group.titleKey)}
                </p>
                <div className="mt-7 flex flex-col gap-5">
                  {group.links.map((link) => (
                    <Link
                      key={link.labelKey}
                      href={withLocale(link.href, locale)}
                      className="md:text-md text-center text-sm text-slate-600 transition-colors hover:text-emerald-600"
                    >
                      {t(link.labelKey)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-slate-200 pt-8 text-center md:mt-14 md:flex-row md:text-start">
          <p className="md:text-md text-base text-slate-600">
            {t('copyright', { year })}
          </p>
          <div className="md:text-md flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base">
            <Link
              href={withLocale('/privacy', locale)}
              className="font-medium text-slate-700 underline underline-offset-2 transition-colors hover:text-emerald-600"
            >
              {t('privacyPolicy')}
            </Link>
            <span className="h-6 w-px bg-slate-400" aria-hidden="true" />
            <Link
              href={withLocale('/terms', locale)}
              className="font-medium text-slate-700 underline underline-offset-2 transition-colors hover:text-emerald-600"
            >
              {t('termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
