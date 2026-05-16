import type { MetadataRoute } from 'next'
import { locales } from '@/i18n'
import {
  getAbsoluteUrl,
  getLocalizedPath,
  publicSeoRoutes,
} from '@/shared/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return locales.flatMap((locale) =>
    publicSeoRoutes.map((route) => ({
      url: getAbsoluteUrl(getLocalizedPath(locale, route)),
      lastModified: now,
      changeFrequency: route === '/' ? 'weekly' : 'monthly',
      priority: route === '/' ? 1 : 0.7,
      alternates: {
        languages: {
          ar: getAbsoluteUrl(getLocalizedPath('ar', route)),
          en: getAbsoluteUrl(getLocalizedPath('en', route)),
        },
      },
    }))
  )
}
