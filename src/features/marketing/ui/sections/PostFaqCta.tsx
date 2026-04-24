'use client'

import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Container } from '@/shared/ui/container'
import { Section } from '@/shared/ui/section'

export function PostFaqCta() {
  const t = useTranslations('post_faq_cta')
  const router = useRouter()
  const { locale, isRTL } = useLocaleInfo()

  return (
    <Section className="border-t border-slate-200/70 bg-linear-to-b from-white via-emerald-50/30 to-white px-4 pt-10 pb-24 sm:px-6 sm:pb-20 lg:px-10">
      <Container>
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <div className="bg-linear-to-r from-emerald-50 via-white to-cyan-50 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
            <p className="mb-2 text-xs font-bold tracking-[0.16em] text-emerald-700 uppercase">
              {t('eyebrow')}
            </p>
            <h3
              className={`landing-section-title mb-3 max-w-4xl ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            >
              {t('title')}
            </h3>
            <p className="landing-subtitle max-w-3xl text-slate-600">
              {t('subtitle')}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {t('point_1')}
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {t('point_2')}
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {t('point_3')}
              </div>
            </div>

            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => router.push(withLocale('/signup', locale))}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-linear-to-r from-orange-600 to-orange-500 px-6 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow md:text-base"
                suppressHydrationWarning
              >
                {t('primary')}
                <ArrowRight
                  className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={() => {
                  const section = document.getElementById('problem')
                  section?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
                className="text-sm font-semibold text-slate-600 underline-offset-4 hover:underline"
              >
                {t('secondary')}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
