'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  AtSign,
  CheckCircle2,
  MessageCircle,
  Phone,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { createAkeedWhatsAppUrl } from '@/shared/lib/whatsapp'
import {
  PublicInfoCard,
  PublicPageShell,
} from '@/shared/layout/PublicPageShell'

const detailKeys = ['detailStore', 'detailContact', 'detailIssue'] as const

export function SupportPageClient() {
  const t = useTranslations('support')
  const { locale } = useLocaleInfo()
  const email = t('email')
  const whatsappHref = createAkeedWhatsAppUrl(t('whatsappMessage'))

  return (
    <PublicPageShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('intro')}
      contentClassName="mx-auto max-w-4xl"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <PublicInfoCard
          icon={<AtSign className="h-5 w-5" />}
          title={t('emailTitle')}
          description={t('emailDescription')}
        >
          <a
            href={`mailto:${email}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            dir="ltr"
          >
            {email}
          </a>
        </PublicInfoCard>

        <PublicInfoCard
          icon={<Phone className="h-5 w-5" />}
          title={t('phoneTitle')}
          description={t('phoneDescription')}
        >
          <a
            href="tel:+20236239569"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            dir="ltr"
          >
            {t('phoneNumber')}
          </a>
        </PublicInfoCard>

        <PublicInfoCard
          icon={<MessageCircle className="h-5 w-5" />}
          title={t('whatsappTitle')}
          description={t('whatsappDescription')}
        >
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-5 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t('whatsappCta')}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </PublicInfoCard>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md md:p-7">
          <h2 className="text-lg font-bold text-slate-800">
            {t('detailsTitle')}
          </h2>
          <ul className="mt-5 space-y-3">
            {detailKeys.map((key) => (
              <li
                key={key}
                className="flex gap-3 text-sm leading-relaxed text-slate-600"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-orange-200/80 bg-orange-50/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7">
          <p className="text-sm font-bold text-orange-700">
            {t('responseTitle')}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {t('responseBody')}
          </p>
        </section>
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
