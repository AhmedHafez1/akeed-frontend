import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.paymob.com',
      },
    ],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Security headers
  async headers() {
    return [
      {
        source: '/:locale/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        // The connect page arrives with a one-time ticket in its address.
        source: '/:locale/whatsapp/:path*',
        headers: [
          {
            // Signup runs in this tab: no other window needs a link to it.
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com",
          },
        ],
      },
      {
        // After the site-wide rule, which it overrides: Meta's code and the
        // signup ticket come back in this page's address.
        source: '/:locale/whatsapp/:path*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
      {
        source: '/:locale/signup/google',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
  // Rewrites for locale-less default
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/webhooks/:path*',
          destination: `${apiBaseUrl}/webhooks/:path*`,
        },
      ],
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${apiBaseUrl}/api/:path*`,
        },
        {
          source: '/',
          destination: '/ar', // Default to Arabic
        },
      ],
      fallback: [],
    }
  },
  allowedDevOrigins: ['*'],
}

export default withNextIntl(nextConfig)
