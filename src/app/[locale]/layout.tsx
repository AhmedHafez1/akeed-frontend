import { Suspense } from 'react'

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
  ogImagePath,
  siteName,
} from '@/shared/lib/seo'
import { ThemeProvider, themeInitScript } from '@/shared/theme'
import { fontVariables } from '@/shared/theme/fonts'
import '../globals.css'

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
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: appIconPath, type: 'image/png', sizes: '512x512' },
      ],
      shortcut: '/favicon.ico',
      apple: [{ url: appIconPath, type: 'image/png', sizes: '512x512' }],
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
      'facebook-domain-verification': 'lioini1ppshou1i78ftxxamkddj1x5',
      'msapplication-TileImage': appIconPath,
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

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <head>
        {/* Sets the `dark` class before first paint to avoid a light flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/*
          Marketing scripts (Facebook Pixel, Google Analytics) are loaded
          ONLY in standalone mode. They are suppressed in Shopify embedded
          mode to avoid unnecessary tracking and CSP issues.
        */}
        <Suspense fallback={null}>
          <MarketingScripts />
        </Suspense>
      </head>
      <body className={`${fontVariables} font-sans`} suppressHydrationWarning>
        <ShopifyAppBridgeScript />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <AppLayout>{children}</AppLayout>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
