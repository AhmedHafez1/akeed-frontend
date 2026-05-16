import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n'
import { createPublicPageMetadata } from '@/shared/lib/seo'
import { LegalDocumentPage } from '@/shared/layout/LegalDocumentPage'

const sections = [1, 2, 3, 4, 5] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal' })

  return createPublicPageMetadata({
    locale: locale as Locale,
    path: '/terms',
    title: t('termsTitle'),
    description: t('termsIntro'),
  })
}

/**
 * Terms of Service Page
 *
 * Public page accessible without authentication.
 */
export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = locale as Locale
  const t = await getTranslations({ locale, namespace: 'legal' })

  return (
    <LegalDocumentPage
      eyebrow={t('termsEyebrow')}
      title={t('termsTitle')}
      lastUpdated={t('termsLastUpdated')}
      companyLine={t('legalCompanyLine')}
      intro={t('termsIntro')}
      sections={sections.map((section) => ({
        title: t(`termsSection${section}Title`),
        body: t(`termsSection${section}Body`),
      }))}
      locale={safeLocale}
      primaryLinkLabel={t('homeLink')}
      secondaryLinkHref="/privacy"
      secondaryLinkLabel={t('privacyLink')}
      isRTL={safeLocale === 'ar'}
    />
  )
}
