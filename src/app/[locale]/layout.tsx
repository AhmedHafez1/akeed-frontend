import { Suspense } from 'react'

import { Cairo } from 'next/font/google'

import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { AppLayout } from '@/shared/layout/AppLayout'
import { MarketingScripts } from '@/shared/layout/MarketingScripts'
import { ShopifyAppBridgeScript } from '@/shared/layout/ShopifyAppBridgeScript'
import '../globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    title: t('title'),
    description: t('description'),
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
        {/*
          Marketing scripts (Facebook Pixel, Google Analytics) are loaded
          ONLY in standalone mode. They are suppressed in Shopify embedded
          mode to avoid unnecessary tracking and CSP issues.
        */}
        <Suspense fallback={null}>
          <MarketingScripts />
        </Suspense>
      </head>
      <body className={cairo.className} suppressHydrationWarning>
        <ShopifyAppBridgeScript />
        <NextIntlClientProvider messages={messages}>
          <AppLayout>{children}</AppLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
