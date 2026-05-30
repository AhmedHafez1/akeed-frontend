import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n'
import { getAllDocSlugs, getDocBySlug } from '@/features/docs/lib/docs'
import { PublicPageShell } from '@/shared/layout/PublicPageShell'
import {
  createPublicPageMetadata,
  getCanonicalUrl,
  getOrganizationSchema,
} from '@/shared/lib/seo'
import { JsonLd } from '@/shared/ui/JsonLd'

export async function generateStaticParams(): Promise<
  Array<{ locale: string; slug: string }>
> {
  const locales = ['en', 'ar'] as const

  const params = await Promise.all(
    locales.map(async (locale) => {
      const slugs = await getAllDocSlugs(locale)
      return slugs.map((slug) => ({ locale, slug }))
    })
  )

  return params.flat()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const doc = await getDocBySlug(locale, slug)

  if (!doc) {
    return {}
  }

  return createPublicPageMetadata({
    locale: locale as Locale,
    path: `/docs/${doc.slug}`,
    title: doc.title,
    description: doc.description ?? doc.title,
  })
}

function getExcerpt(content: string): string {
  const stripped = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_~\-|\[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return stripped.length > 220 ? `${stripped.slice(0, 220).trim()}...` : stripped
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const safeLocale = locale as Locale
  const t = await getTranslations({ locale, namespace: 'docs' })
  const doc = await getDocBySlug(locale, slug)

  if (!doc) {
    notFound()
  }

  const docUrl = getCanonicalUrl(safeLocale, `/docs/${doc.slug}`)
  const articleDescription = doc.description ?? getExcerpt(doc.content)
  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: doc.title,
    description: articleDescription,
    url: docUrl,
    inLanguage: safeLocale,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': docUrl,
    },
    publisher: getOrganizationSchema(safeLocale),
  }

  return (
    <>
      <JsonLd data={articleStructuredData} />
      <PublicPageShell
        eyebrow={t('eyebrow')}
        title={doc.title}
        description={articleDescription}
        contentClassName="mx-auto max-w-3xl"
      >
        <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
          <pre className="overflow-x-auto text-sm leading-7 whitespace-pre-wrap text-slate-700">
            {doc.content.trim()}
          </pre>
        </article>

        <div className="mt-8 flex justify-center">
          <Link
            href={`/${safeLocale}/docs`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-100 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t('backToDocs')}
          </Link>
        </div>
      </PublicPageShell>
    </>
  )
}
