import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl'
import '../globals.css'

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
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.shopify = { loading: function () {} };',
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
