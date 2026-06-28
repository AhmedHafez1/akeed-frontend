import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n'
import {
  createPublicPageMetadata,
  getOrganizationSchema,
} from '@/shared/lib/seo'
import { JsonLd } from '@/shared/ui/JsonLd'
import { AboutPageClient } from './AboutPageClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })

  return createPublicPageMetadata({
    locale: locale as Locale,
    path: '/about',
    title: t('title'),
    description: t('intro'),
  })
}

async function getAboutStructuredData(locale: Locale) {
  return [getOrganizationSchema(locale)]
}

export default async function AboutPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  const structuredData = await getAboutStructuredData(locale as Locale)

  return (
    <>
      {structuredData.map((data) => (
        <JsonLd key={data['@type']} data={data} />
      ))}
      <AboutPageClient />
    </>
  )
}
