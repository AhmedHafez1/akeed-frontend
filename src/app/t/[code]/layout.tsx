import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { getShippingTrackingView } from '@/features/shipping-tracking'
import { DEFAULT_LOCALE, getLocaleDirection } from '@/shared/lib/locale'
import { noIndexMetadata } from '@/shared/lib/seo'
import { themeInitScript } from '@/shared/theme'
import { fontVariables } from '@/shared/theme/fonts'
import '../../globals.css'

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: 'Akeed',
  referrer: 'no-referrer',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

/**
 * The Track order short link lives outside the locale-prefixed app, so it
 * has its own root layout: the page's language and direction come from the
 * message the customer received, not from the URL.
 */
export default async function TrackingLinkLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const view = await getShippingTrackingView(code)
  const locale = view.kind === 'page' ? view.language : DEFAULT_LOCALE

  return (
    <html
      lang={locale}
      dir={getLocaleDirection(locale)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${fontVariables} font-sans`}>{children}</body>
    </html>
  )
}
