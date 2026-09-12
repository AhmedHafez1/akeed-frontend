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
  CREDIT_CURRENCY,
  CREDIT_UNIT_PRICE_MINOR,
} from '@/shared/config/pricing'
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
  const pricing = await getTranslations({
    locale,
    namespace: 'pricing_credits',
  })
  const faq = await getTranslations({ locale, namespace: 'faq' })

  const unitPrice = (CREDIT_UNIT_PRICE_MINOR / 100).toFixed(2)

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: getCanonicalUrl(locale),
    description: metadata('description'),
    /*
     * Metered, not a subscription: the product is priced per WhatsApp message,
     * so a flat Offer would misdescribe it. `PreOrder` is the honest
     * availability while standalone accounts require manual approval.
     */
    offers: {
      '@type': 'Offer',
      price: unitPrice,
      priceCurrency: CREDIT_CURRENCY,
      availability: 'https://schema.org/PreOrder',
      description: pricing('unit_price_note'),
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: unitPrice,
        priceCurrency: CREDIT_CURRENCY,
        unitText: pricing('unit_price_label'),
      },
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
