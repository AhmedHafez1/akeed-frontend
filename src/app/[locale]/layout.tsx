import { Suspense } from 'react'

import { Cairo } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { MarketingScripts } from '@/components/layout/MarketingScripts'
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
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        {/*
          Shopify App Bridge v4 — loaded via CDN for embedded mode.
          The script exposes `window.shopify` with session token,
          navigation, and toast APIs. It is a no-op when the page
          is not loaded inside the Shopify Admin iframe.
        */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" data-api-key={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}></script>
        {/*
          Marketing scripts (Facebook Pixel, Google Analytics) are loaded
          ONLY in standalone mode. They are suppressed in Shopify embedded
          mode to avoid unnecessary tracking and CSP issues.
        */}
        <Suspense fallback={null}>
          <MarketingScripts />
        </Suspense>
      </head>
      <body className={cairo.className}>
        <NextIntlClientProvider messages={messages}>
          <AppLayout>{children}</AppLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
