'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'

export default function SupportPage() {
  const t = useTranslations('support')
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')
  const email = t('email')

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold tracking-wide text-emerald-600 uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {t('title')}
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            {t('intro')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">
              {t('emailTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {t('emailDescription')}
            </p>
            <a
              href={`mailto:${email}`}
              className="inline-flex text-base font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
            >
              {email}
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-800">
            {t('responseTitle')}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            {t('responseBody')}
          </p>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <Link
            href={withLocale('/', locale)}
            className="text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
