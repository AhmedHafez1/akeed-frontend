'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, withLocale } from '@/shared/lib/locale'
import { useTranslations } from 'next-intl'

/**
 * Privacy Policy Page
 *
 * Public page accessible without authentication.
 */

export default function PrivacyPage() {
  const t = useTranslations('legal')
  const tAuth = useTranslations('auth')
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname ?? '')

  const sections = [1, 2, 3, 4, 5] as const

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            {t('privacyTitle')}
          </h1>
          <p className="text-sm text-slate-500">{t('privacyLastUpdated')}</p>
          <p className="text-sm text-slate-600">{t('legalCompanyLine')}</p>
          <p className="text-sm text-slate-600">{t('privacyIntro')}</p>
        </div>

        <div className="space-y-6">
          {sections.map((n) => (
            <div key={n} className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-800">
                {t(`privacySection${n}Title`)}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                {t(`privacySection${n}Body`)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-6">
          <Link
            href={withLocale('/login', locale)}
            className="text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            {tAuth('backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  )
}
