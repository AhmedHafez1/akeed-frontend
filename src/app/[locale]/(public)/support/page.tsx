import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n'
import {
  businessPhone,
  createPublicPageMetadata,
  getCanonicalUrl,
  getOrganizationSchema,
} from '@/shared/lib/seo'
import { JsonLd } from '@/shared/ui/JsonLd'
import { SupportPageClient } from './SupportPageClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'support' })

  return createPublicPageMetadata({
    locale: locale as Locale,
    path: '/support',
    title: t('title'),
    description: t('intro'),
  })
}

async function getSupportStructuredData(locale: Locale) {
  const support = await getTranslations({ locale, namespace: 'support' })

  return [
    getOrganizationSchema(locale),
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: support('title'),
      description: support('intro'),
      url: getCanonicalUrl(locale, '/support'),
      mainEntity: {
        '@type': 'Organization',
        name: 'Akeed',
        email: support('email'),
        telephone: businessPhone,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: support('email'),
            telephone: businessPhone,
          },
        ],
      },
    },
  ]
}

export default async function SupportPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  const structuredData = await getSupportStructuredData(locale as Locale)

  return (
    <>
      {structuredData.map((data) => (
        <JsonLd key={data['@type']} data={data} />
      ))}
      <SupportPageClient />
    </>
  )
}
