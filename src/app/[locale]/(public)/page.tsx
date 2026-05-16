/**
 * Root Page - Mode-aware landing.
 *
 * - Embedded: sends merchants to onboarding (if pending) or dashboard.
 * - Standalone: renders the marketing homepage.
 */

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { HomePage } from '@/features/marketing'
import { EmbeddedAuthGate } from '@/shared/auth/EmbeddedAuthGate'
import { faqs } from '@/features/marketing/config/site'
import type { Locale } from '@/i18n'
import {
  createPublicPageMetadata,
  getCanonicalUrl,
  getOrganizationSchema,
  siteName,
} from '@/shared/lib/seo'
import { JsonLd } from '@/shared/ui/JsonLd'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return createPublicPageMetadata({
    locale: locale as Locale,
    title: t('title'),
    description: t('description'),
  })
}

async function getHomeStructuredData(locale: Locale) {
  const metadata = await getTranslations({ locale, namespace: 'metadata' })
  const hero = await getTranslations({ locale, namespace: 'hero' })
  const faq = await getTranslations({ locale, namespace: 'faq' })

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: getCanonicalUrl(locale),
    description: metadata('description'),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: hero('no_credit_card'),
    },
  }

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ key }) => ({
      '@type': 'Question',
      name: faq(`${key}.question`),
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq(`${key}.answer`),
      },
    })),
  }

  return [softwareApplication, getOrganizationSchema(locale), faqPage]
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const structuredData = await getHomeStructuredData(locale as Locale)

  return (
    <>
      {structuredData.map((data) => (
        <JsonLd key={data['@type'] as string} data={data} />
      ))}
      <EmbeddedAuthGate onboardingGate="landing">
        <HomePage />
      </EmbeddedAuthGate>
    </>
  )
}
