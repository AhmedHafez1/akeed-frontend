import { Suspense } from 'react'

import { Cairo, Inter } from 'next/font/google'

import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n'
import { AppLayout } from '@/shared/layout/AppLayout'
import { MarketingScripts } from '@/shared/layout/MarketingScripts'
import { ShopifyAppBridgeScript } from '@/shared/layout/ShopifyAppBridgeScript'
import {
  appIconPath,
  getAbsoluteUrl,
  getLocalizedLanguageAlternates,
  getOpenGraphAlternateLocale,
  getOpenGraphLocale,
  getSiteOrigin,
  logoPath,
  ogImagePath,
  siteName,
} from '@/shared/lib/seo'
import '../globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const safeLocale = locale as Locale
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const title = t('title')
  const description = t('description')

  return {
    metadataBase: new URL(getSiteOrigin()),
    applicationName: siteName,
    creator: siteName,
    publisher: siteName,
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    alternates: getLocalizedLanguageAlternates('/', safeLocale),
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: appIconPath,
    },
    openGraph: {
      title,
      description,
      url: getAbsoluteUrl(`/${locale}`),
      siteName,
      locale: getOpenGraphLocale(safeLocale),
      alternateLocale: getOpenGraphAlternateLocale(safeLocale),
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
    other: {
      'msapplication-TileImage': logoPath,
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const bodyFontClassName = locale === 'ar' ? cairo.className : inter.className

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <head>
        {/*
          Marketing scripts (Facebook Pixel, Google Analytics) are loaded
          ONLY in standalone mode. They are suppressed in Shopify embedded
          mode to avoid unnecessary tracking and CSP issues.
        */}
        <Suspense fallback={null}>
          <MarketingScripts />
        </Suspense>
      </head>
      <body className={bodyFontClassName} suppressHydrationWarning>
        <ShopifyAppBridgeScript />
        <NextIntlClientProvider messages={messages}>
          <AppLayout>{children}</AppLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
