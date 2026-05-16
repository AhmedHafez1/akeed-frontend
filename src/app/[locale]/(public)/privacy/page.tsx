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
    path: '/privacy',
    title: t('privacyTitle'),
    description: t('privacyIntro'),
  })
}

/**
 * Privacy Policy Page
 *
 * Public page accessible without authentication.
 */
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = locale as Locale
  const t = await getTranslations({ locale, namespace: 'legal' })

  return (
    <LegalDocumentPage
      eyebrow={t('privacyEyebrow')}
      title={t('privacyTitle')}
      lastUpdated={t('privacyLastUpdated')}
      companyLine={t('legalCompanyLine')}
      intro={t('privacyIntro')}
      sections={sections.map((section) => ({
        title: t(`privacySection${section}Title`),
        body: t(`privacySection${section}Body`),
      }))}
      locale={safeLocale}
      primaryLinkLabel={t('homeLink')}
      secondaryLinkHref="/terms"
      secondaryLinkLabel={t('termsLink')}
      isRTL={safeLocale === 'ar'}
    />
  )
}
