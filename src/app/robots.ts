import type { MetadataRoute } from 'next'
import { getSiteOrigin, privateSeoRoutes } from '@/shared/lib/seo'
import { locales } from '@/i18n'

export default function robots(): MetadataRoute.Robots {
  const disallowedRoutes = [
    '/api/',
    '/webhooks/',
    ...locales.flatMap((locale) =>
      privateSeoRoutes.map((route) => `/${locale}${route}`)
    ),
  ]

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: disallowedRoutes,
    },
    sitemap: `${getSiteOrigin()}/sitemap.xml`,
    host: getSiteOrigin(),
  }
}
