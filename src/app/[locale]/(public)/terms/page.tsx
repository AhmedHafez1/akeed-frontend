'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { LegalDocumentPage } from '@/shared/layout/LegalDocumentPage'

const sections = [1, 2, 3, 4, 5] as const

/**
 * Terms of Service Page
 *
 * Public page accessible without authentication.
 */
export default function TermsPage() {
  const t = useTranslations('legal')
  const { locale, isRTL } = useLocaleInfo()

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
      locale={locale}
      primaryLinkLabel={t('homeLink')}
      secondaryLinkHref="/privacy"
      secondaryLinkLabel={t('privacyLink')}
      isRTL={isRTL}
    />
  )
}
