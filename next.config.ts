import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
    ]
  },
  // Rewrites for locale-less default
  async rewrites() {
    return [
      {
        source: '/webhooks/:path*',
        destination: `${apiBaseUrl}/webhooks/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: '/',
        destination: '/ar', // Default to Arabic
      },
    ]
  },
}

export default withNextIntl(nextConfig)
