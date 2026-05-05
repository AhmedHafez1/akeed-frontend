import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export const config = {
  matcher: [
    '/',
    '/(ar|en)/:path*',
    '/((?!api|webhooks|auth/shopify|_next|_vercel|images|fonts|.*\\..*).*)',
  ],
}
