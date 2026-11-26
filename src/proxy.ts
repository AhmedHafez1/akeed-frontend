import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Locale-less links always resolve to the default (Arabic); never follow
  // Accept-Language or the NEXT_LOCALE cookie.
  localeDetection: false,
})

export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const rootLocale = locales.find(
    (locale) => pathname === `/${locale}` || pathname === `/${locale}/`
  )
  if (
    (pathname === '/' || rootLocale) &&
    searchParams.get('shop')?.trim() &&
    searchParams.get('host')?.trim() &&
    (!searchParams.has('embedded') || searchParams.get('embedded') === '1')
  ) {
    const target = new URL(request.url)
    target.pathname = `/${rootLocale ?? defaultLocale}/dashboard`
    return NextResponse.redirect(target)
  }
  // The admin screens exist in English only.
  if (/^\/(?:ar|ur|es|fr|tr)\/admin(?:\/|$)/.test(request.nextUrl.pathname)) {
    const target = request.nextUrl.clone()
    target.pathname = request.nextUrl.pathname.replace(
      /^\/(?:ar|ur|es|fr|tr)\//,
      '/en/'
    )
    return NextResponse.redirect(target)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/',
    '/(ar|en|ur|es|fr|tr)/:path*',
    // `t/` is the Track order short link: it has no locale prefix.
    '/((?!api|webhooks|auth/shopify|t/|_next|_vercel|images|fonts|.*\\..*).*)',
  ],
}
