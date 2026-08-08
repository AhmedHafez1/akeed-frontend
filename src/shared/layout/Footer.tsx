'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Instagram, Youtube } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import {
  facebookProfileUrl,
  youtubeProfileUrl,
  instagramProfileUrl,
  legalName,
  commercialRegistrationNumber,
  registeredAddress,
  businessPhone,
} from '@/shared/lib/seo'

const footerLinkGroups = [
  {
    titleKey: 'navigationTitle',
    links: [
      { href: '/', labelKey: 'home' },
      { href: '/about', labelKey: 'about' },
      { href: '/#solution', labelKey: 'features' },
      { href: '/#pricing', labelKey: 'pricing' },
      { href: '/docs', labelKey: 'docs' },
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
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-410 rounded-3xl px-6 py-10">
        <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
          <div className="flex flex-col items-center justify-center md:items-start md:justify-start md:text-start">
            <Link href={withLocale('/', locale)}>
              <Image
                src="/images/akeed-web-logo-horizontal-white.png"
                alt={t('logoAlt')}
                width={110}
                height={80}
                className="h-auto object-contain"
              />
            </Link>
            <p className="md:text-md mt-1 max-w-xl text-sm leading-8 text-slate-400">
              {t('legalLine')}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <Link
                href={facebookProfileUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t('facebook')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-emerald-500/15 hover:text-emerald-300 hover:ring-emerald-400/30"
              >
                <FacebookIcon className="h-5 w-5" />
              </Link>
              <Link
                href={youtubeProfileUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t('youtube')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-emerald-500/15 hover:text-emerald-300 hover:ring-emerald-400/30"
              >
                <Youtube className="h-5 w-5" />
              </Link>
              <Link
                href={instagramProfileUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t('instagram')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-emerald-500/15 hover:text-emerald-300 hover:ring-emerald-400/30"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <nav
            aria-label={t('navigationLabel')}
            className="flex w-full flex-row-reverse justify-center gap-8 md:gap-20 md:text-left lg:justify-start lg:gap-32"
          >
            {footerLinkGroups.map((group) => (
              <div key={group.titleKey}>
                <p className="md:text-md text-center text-sm font-bold text-white">
                  {t(group.titleKey)}
                </p>
                <div className="mt-7 flex flex-col gap-5">
                  {group.links.map((link) => (
                    <Link
                      key={link.labelKey}
                      href={withLocale(link.href, locale)}
                      className="md:text-md text-center text-sm text-slate-400 transition-colors hover:text-emerald-300"
                    >
                      {t(link.labelKey)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <section
          aria-label={t('businessInfoTitle')}
          className="mt-12 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
        >
          <p className="md:text-md text-sm font-bold text-white">
            {t('businessInfoTitle')}
          </p>
          <dl className="mt-5 grid gap-x-10 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-300">
                {t('legalNameLabel')}
              </dt>
              <dd
                className="mt-1 text-slate-400"
                style={{ unicodeBidi: 'plaintext' }}
              >
                {legalName}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-300">
                {t('registrationLabel')}
              </dt>
              <dd className="mt-1 text-slate-400" dir="ltr">
                {commercialRegistrationNumber}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-300">
                {t('addressLabel')}
              </dt>
              <dd
                className="mt-1 leading-relaxed whitespace-pre-line text-slate-400"
                style={{ unicodeBidi: 'plaintext' }}
              >
                {registeredAddress}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-300">{t('phoneLabel')}</dt>
              <dd className="mt-1">
                <a
                  href={`tel:${businessPhone}`}
                  className="text-slate-400 transition-colors hover:text-emerald-300"
                  dir="ltr"
                >
                  {businessPhone}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 text-center md:mt-14 md:flex-row md:text-start">
          <p className="md:text-md text-sm text-slate-400">
            {t('copyright', { year })}
          </p>
          <div className="md:text-md flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link
              href={withLocale('/privacy', locale)}
              className="font-medium text-slate-300 underline underline-offset-2 transition-colors hover:text-emerald-300"
            >
              {t('privacyPolicy')}
            </Link>
            <span className="h-6 w-px bg-white/20" aria-hidden="true" />
            <Link
              href={withLocale('/terms', locale)}
              className="font-medium text-slate-300 underline underline-offset-2 transition-colors hover:text-emerald-300"
            >
              {t('termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
