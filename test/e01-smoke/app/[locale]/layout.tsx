import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { IBM_Plex_Sans_Arabic, Inter } from 'next/font/google'
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl'
import { FixtureQueryProvider } from './FixtureQueryProvider'
import '../globals.css'

// The production font stack, so fixture screenshots match the app.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
})

export default async function SmokeLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (locale !== 'en' && locale !== 'ar') notFound()
  const messages = JSON.parse(
    await readFile(
      path.resolve(process.cwd(), '../../public/messages', `${locale}.json`),
      'utf8'
    )
  ) as AbstractIntlMessages
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className={`${inter.variable} ${plexArabic.variable} font-sans`}>
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.shopify = { loading: function () {} };',
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FixtureQueryProvider>{children}</FixtureQueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
