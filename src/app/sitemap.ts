import type { MetadataRoute } from 'next'
import { getAllDocSlugs } from '@/features/docs/lib/docs'
import { locales } from '@/i18n'
import {
  getAbsoluteUrl,
  getLocalizedPath,
  publicSeoRoutes,
} from '@/shared/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const docsSlugsByLocale = new Map<string, Set<string>>()

  await Promise.all(
    locales.map(async (locale) => {
      const slugs = await getAllDocSlugs(locale)
      docsSlugsByLocale.set(locale, new Set(slugs))
    })
  )

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    publicSeoRoutes.map((route) => ({
      url: getAbsoluteUrl(getLocalizedPath(locale, route)),
      lastModified: now,
      changeFrequency: (route === '/' ? 'weekly' : 'monthly') as
        | 'weekly'
        | 'monthly',
      priority: route === '/' ? 1 : 0.7,
      alternates: {
        languages: {
          ar: getAbsoluteUrl(getLocalizedPath('ar', route)),
          en: getAbsoluteUrl(getLocalizedPath('en', route)),
        },
      },
    }))
  )

  const docsDetailRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => {
    const localeSlugs = docsSlugsByLocale.get(locale)
    if (!localeSlugs) return []

    return Array.from(localeSlugs).map((slug) => {
      const languageAlternates = Object.fromEntries(
        locales
          .filter((altLocale) => docsSlugsByLocale.get(altLocale)?.has(slug))
          .map((altLocale) => [
            altLocale,
            getAbsoluteUrl(getLocalizedPath(altLocale, `/docs/${slug}`)),
          ])
      )

      return {
        url: getAbsoluteUrl(getLocalizedPath(locale, `/docs/${slug}`)),
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        alternates: {
          languages: languageAlternates,
        },
      }
    })
  })

  return [...staticRoutes, ...docsDetailRoutes]
}
