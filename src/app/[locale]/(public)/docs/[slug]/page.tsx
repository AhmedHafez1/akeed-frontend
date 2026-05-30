import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n'
import { buildMultiLocaleDocsSearchIndex } from '@/features/docs/lib/docs-search.server'
import {
  getDocPager,
  getDocsBreadcrumbs,
  getDocsNavItems,
} from '@/features/docs/lib/docs-navigation'
import { getAllDocSlugs, getDocBySlug } from '@/features/docs/lib/docs'
import { DocsBreadcrumbs } from '@/features/docs/ui/DocsBreadcrumbs'
import { DocsLayout } from '@/features/docs/ui/DocsLayout'
import { MarkdownContent } from '@/features/docs/ui/MarkdownContent'
import { DocsPager } from '@/features/docs/ui/DocsPager'
import { DocsSearch } from '@/features/docs/ui/DocsSearch'
import { DocsSidebar } from '@/features/docs/ui/DocsSidebar'
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

  const [docsNavItems, searchEntries] = await Promise.all([
    getDocsNavItems(safeLocale),
    buildMultiLocaleDocsSearchIndex(),
  ])
  const pager = await getDocPager(safeLocale, doc.slug)
  const breadcrumbs = getDocsBreadcrumbs(safeLocale, doc.title)

  const desktopSidebar = <DocsSidebar items={docsNavItems} activeSlug={doc.slug} />
  const mobileSidebar = (
    <DocsSidebar items={docsNavItems} activeSlug={doc.slug} showTitle={false} />
  )

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
        contentClassName="mx-auto max-w-6xl"
      >
        <DocsLayout sidebar={desktopSidebar} mobileSidebar={mobileSidebar}>
          <div className="mb-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <DocsSearch locale={safeLocale} entries={searchEntries} />
          </div>

          <DocsBreadcrumbs items={breadcrumbs} />

          <article className="mt-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
            <MarkdownContent
              content={doc.content.trim()}
              locale={safeLocale}
              currentSlug={doc.slug}
            />
          </article>

          <DocsPager previous={pager.previous} next={pager.next} />

          <div className="mt-6 flex justify-center">
            <Link
              href={`/${safeLocale}/docs`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-100 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t('backToDocs')}
            </Link>
          </div>
        </DocsLayout>
      </PublicPageShell>
    </>
  )
}
