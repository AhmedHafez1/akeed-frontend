import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export default function proxy(request: NextRequest) {
  if (/^\/ar\/admin(?:\/|$)/.test(request.nextUrl.pathname)) {
    const target = request.nextUrl.clone()
    target.pathname = request.nextUrl.pathname.replace(/^\/ar\//, '/en/')
    return NextResponse.redirect(target)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/',
    '/(ar|en)/:path*',
    '/((?!api|webhooks|auth/shopify|_next|_vercel|images|fonts|.*\\..*).*)',
  ],
}
