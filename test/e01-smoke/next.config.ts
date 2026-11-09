import path from 'node:path'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const config: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.CR05_BACKEND_URL ? '.next/cr05-integrated' : '.next',
  async rewrites() {
    // The integration runner supplies only its own loopback API. Never proxy
    // this fixture's synthetic bearer token to a remote service.
    const backend = process.env.CR05_BACKEND_URL
    if (!backend) return []
    const url = new URL(backend)
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1')
      throw new Error('The change-request fixture requires a loopback API')
    return [{ source: '/cr05-api/:path*', destination: `${url.origin}/:path*` }]
  },
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@\/shared\/lib\/auth$/,
        path.resolve(process.cwd(), 'app/[locale]/fixtureApi.ts')
      )
    )
    return config
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self'; form-action 'none'; frame-src 'none'",
          },
        ],
      },
    ]
  },
}

export default createNextIntlPlugin('./i18n.ts')(config)
