import type { Metadata } from 'next'
import type { Locale } from '@/i18n'
import { defaultLocale, locales } from '@/i18n'

// Business identity below must stay byte-identical to the Meta Business
// Portfolio record (portfolio ID 859731917035191) so business verification
// reviewers see the same legal name, address, and phone on both sides.
export const siteName = 'Akeed'
export const supportEmail = 'support@getakeed.com'
export const legalName = 'أكيد للحلول الرقمية - Akeed Digital Solutions'
export const commercialRegistrationNumber = '5813'
export const businessPhone = '+201148675077'
export const registeredAddressStreet =
  'الجيزة - الأهرام - شقة ١٣ الدور الثالث - قطعة ٤٧٣ منطقة ( أ ) - هضبة الأهرام'
export const registeredAddressLocality = 'الأهرام'
export const registeredAddressRegion = 'الجيزة'
export const registeredAddressPostalCode = '12556'
export const registeredAddressCountry = 'Egypt'
export const registeredAddress = `${registeredAddressStreet}
${registeredAddressLocality}, ${registeredAddressRegion} ${registeredAddressPostalCode}
${registeredAddressCountry}`
export const facebookProfileUrl =
  'https://www.facebook.com/profile.php?id=61585900432277'
export const youtubeProfileUrl = 'https://www.youtube.com/@akeed-digital'
export const instagramProfileUrl = 'https://www.instagram.com/akeed_app'

export const publicSeoRoutes = [
  '/',
  '/about',
  '/support',
  '/privacy',
  '/terms',
  '/docs',
] as const

export const privateSeoRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/dashboard',
  '/verifications',
  '/settings',
  '/onboarding',
  '/automation-settings',
  '/message-preview',
] as const

export const ogImagePath = '/images/akeed-app-icon-1200.png'
export const logoPath = '/images/akeed-web-logo-horizontal.png'
export const appIconPath = '/images/akeed-web-app-icon-512.png'

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export function getSiteOrigin(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '')
  }

  return `http://localhost:${process.env.PORT || 3001}`
}

export function getLocalizedPath(locale: Locale, path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return normalizedPath === '/' ? `/${locale}` : `/${locale}${normalizedPath}`
}

export function getAbsoluteUrl(path = '/'): string {
  return new URL(path, getSiteOrigin()).toString()
}

export function getCanonicalUrl(locale: Locale, path = '/'): string {
  return getAbsoluteUrl(getLocalizedPath(locale, path))
}

export function getLanguageAlternates(path = '/') {
  return {
    canonical: getLocalizedPath(defaultLocale, path),
    languages: {
      ar: getLocalizedPath('ar', path),
      en: getLocalizedPath('en', path),
      'x-default': getLocalizedPath(defaultLocale, path),
    },
  }
}

export function getLocalizedLanguageAlternates(path = '/', locale: Locale) {
  return {
    canonical: getLocalizedPath(locale, path),
    languages: getLanguageAlternates(path).languages,
  }
}

export function getOpenGraphLocale(locale: Locale): string {
  return locale === 'ar' ? 'ar_AR' : 'en_US'
}

export function getOpenGraphAlternateLocale(locale: Locale): string[] {
  return locale === 'ar' ? ['en_US'] : ['ar_AR']
}

interface PageMetadataInput {
  locale: Locale
  path?: string
  title: string
  description: string
}

export function createPublicPageMetadata({
  locale,
  path = '/',
  title,
  description,
}: PageMetadataInput): Metadata {
  const canonicalUrl = getCanonicalUrl(locale, path)

  return {
    title,
    description,
    alternates: getLocalizedLanguageAlternates(path, locale),
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName,
      locale: getOpenGraphLocale(locale),
      alternateLocale: getOpenGraphAlternateLocale(locale),
      type: 'website',
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 1200,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImagePath],
    },
  }
}

export function createJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function getOrganizationSchema(locale: Locale) {
  const localizedHomeUrl = getCanonicalUrl(locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    legalName,
    identifier: commercialRegistrationNumber,
    url: localizedHomeUrl,
    logo: getAbsoluteUrl(logoPath),
    email: supportEmail,
    telephone: businessPhone,
    sameAs: [facebookProfileUrl, youtubeProfileUrl, instagramProfileUrl],
    address: {
      '@type': 'PostalAddress',
      streetAddress: registeredAddressStreet,
      addressLocality: registeredAddressLocality,
      addressRegion: registeredAddressRegion,
      postalCode: registeredAddressPostalCode,
      addressCountry: 'EG',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: supportEmail,
        telephone: businessPhone,
        availableLanguage: locales,
      },
    ],
  }
}
