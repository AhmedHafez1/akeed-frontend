'use client'

import Link from 'next/link'
import {
  AtSign,
  Building2,
  FileCheck,
  Globe,
  MapPin,
  Phone,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import {
  facebookProfileUrl,
  youtubeProfileUrl,
  instagramProfileUrl,
  supportEmail,
  legalName,
  commercialRegistrationNumber,
  registeredAddress,
  businessPhone,
} from '@/shared/lib/seo'
import {
  PublicInfoCard,
  PublicPageShell,
} from '@/shared/layout/PublicPageShell'

export function AboutPageClient() {
  const t = useTranslations('about')
  const { locale } = useLocaleInfo()

  return (
    <PublicPageShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('intro')}
      contentClassName="mx-auto max-w-4xl"
    >
      <div className="space-y-8">
        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md md:p-8">
          <h2 className="text-xl font-bold text-slate-800">
            {t('missionTitle')}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-8">
            {t('missionBody')}
          </p>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <PublicInfoCard
            icon={<Building2 className="h-5 w-5" />}
            title={t('legalTitle')}
            description={t('legalDescription')}
          >
            <div className="space-y-2 text-sm text-slate-600">
              <p
                className="font-medium text-slate-800"
                style={{ unicodeBidi: 'plaintext' }}
              >
                {legalName}
              </p>
              <div className="flex items-start gap-2">
                <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  {t('registrationLabel')}: {commercialRegistrationNumber}
                </span>
              </div>
            </div>
          </PublicInfoCard>

          <PublicInfoCard
            icon={<MapPin className="h-5 w-5" />}
            title={t('addressTitle')}
            description={t('addressDescription')}
          >
            <p
              className="text-sm leading-relaxed whitespace-pre-line text-slate-600"
              style={{ unicodeBidi: 'plaintext' }}
            >
              {registeredAddress}
            </p>
          </PublicInfoCard>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <PublicInfoCard
            icon={<Phone className="h-5 w-5" />}
            title={t('phoneTitle')}
            description={t('phoneDescription')}
          >
            <a
              href={`tel:${businessPhone}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
              dir="ltr"
            >
              {businessPhone}
            </a>
          </PublicInfoCard>

          <PublicInfoCard
            icon={<AtSign className="h-5 w-5" />}
            title={t('emailTitle')}
            description={t('emailDescription')}
          >
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
              dir="ltr"
            >
              {supportEmail}
            </a>
          </PublicInfoCard>
        </div>

        <PublicInfoCard
          icon={<Globe className="h-5 w-5" />}
          title={t('socialTitle')}
          description={t('socialDescription')}
        >
          <div className="flex flex-wrap gap-3">
            <a
              href={facebookProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Facebook
            </a>
            <a
              href={youtubeProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              YouTube
            </a>
            <a
              href={instagramProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Instagram
            </a>
          </div>
        </PublicInfoCard>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href={withLocale('/', locale)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-100 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t('backHome')}
        </Link>
      </div>
    </PublicPageShell>
  )
}
