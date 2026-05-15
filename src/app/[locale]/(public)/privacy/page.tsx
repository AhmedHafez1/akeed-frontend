'use client'

import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { LegalDocumentPage } from '@/shared/layout/LegalDocumentPage'

const sections = [1, 2, 3, 4, 5] as const

/**
 * Privacy Policy Page
 *
 * Public page accessible without authentication.
 */
export default function PrivacyPage() {
  const t = useTranslations('legal')
  const { locale, isRTL } = useLocaleInfo()

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
      locale={locale}
      primaryLinkLabel={t('homeLink')}
      secondaryLinkHref="/terms"
      secondaryLinkLabel={t('termsLink')}
      isRTL={isRTL}
    />
  )
}
