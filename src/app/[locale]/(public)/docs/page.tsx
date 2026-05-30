import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n'
import { getDocList } from '@/features/docs/lib/docs'
import { PublicPageShell } from '@/shared/layout/PublicPageShell'
import { createPublicPageMetadata } from '@/shared/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'docs' })

  return createPublicPageMetadata({
    locale: locale as Locale,
    path: '/docs',
    title: t('title'),
    description: t('description'),
  })
}

export default async function DocsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = locale as Locale
  const t = await getTranslations({ locale, namespace: 'docs' })
  const docs = await getDocList(locale)

  return (
    <PublicPageShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      contentClassName="mx-auto max-w-4xl"
    >
      {docs.length === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-slate-600 shadow-sm">
          {t('empty')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/${safeLocale}/docs/${doc.slug}`}
              className="group rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-slate-800 transition-colors group-hover:text-emerald-700">
                {doc.title}
              </h2>
              {doc.description ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {doc.description}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </PublicPageShell>
  )
}
