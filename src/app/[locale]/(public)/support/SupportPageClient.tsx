'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  AtSign,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { withLocale } from '@/shared/lib/locale'
import { createAkeedWhatsAppUrl } from '@/shared/lib/whatsapp'
import { businessPhone, registeredAddress } from '@/shared/lib/seo'
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
            className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring/40 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
            href={`tel:${businessPhone}`}
            className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring/40 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            dir="ltr"
          >
            {t('phoneNumber')}
          </a>
        </PublicInfoCard>

        <PublicInfoCard
          icon={<MapPin className="h-5 w-5" />}
          title={t('addressTitle')}
          description={t('addressDescription')}
        >
          <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-line">
            {registeredAddress}
          </p>
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
            className="border-border bg-muted text-foreground hover:border-input hover:bg-accent focus-visible:ring-ring/40 inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t('whatsappCta')}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </PublicInfoCard>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <section className="border-border bg-card hover:border-input rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7">
          <h2 className="text-foreground text-lg font-bold">
            {t('detailsTitle')}
          </h2>
          <ul className="mt-5 space-y-3">
            {detailKeys.map((key) => (
              <li
                key={key}
                className="text-foreground/70 flex gap-3 text-sm leading-relaxed"
              >
                <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-warning-border bg-warning-subtle/60 rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7">
          <p className="text-warning text-sm font-bold">{t('responseTitle')}</p>
          <p className="text-foreground/70 mt-3 text-sm leading-relaxed">
            {t('responseBody')}
          </p>
        </section>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href={withLocale('/', locale)}
          className="hover:text-primary-hover border-border bg-card text-foreground/80 hover:border-input focus-visible:ring-ring/40 inline-flex h-11 items-center justify-center rounded-xl border px-6 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t('backHome')}
        </Link>
      </div>
    </PublicPageShell>
  )
}
