import path from 'node:path'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const config: NextConfig = {
  reactStrictMode: true,
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
