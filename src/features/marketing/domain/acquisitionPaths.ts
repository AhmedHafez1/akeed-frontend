import type { StartRoute } from '@/shared/config/commerceSources'
import { withLocale } from '@/shared/lib/locale'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'

/**
 * The two destinations a visitor can start from.
 *
 * `shopify` installs the embedded app from the App Store, where Shopify also
 * presents its own subscription pricing. `standalone` opens signup, whose
 * first step asks where the orders come from.
 */
export type AcquisitionPath = 'shopify' | 'standalone'

export interface AcquisitionTarget {
  path: AcquisitionPath
  /** Drives `<a>` vs `next/link` at the call site. */
  kind: 'external' | 'internal'
  href: string
}

export type AcquisitionTargets = Record<AcquisitionPath, AcquisitionTarget>

/**
 * Deliberately returns no label strings: the wording differs per surface
 * (header chip vs hero button vs sticky bar), so labels come from `next-intl`
 * at the call site.
 */
export function getAcquisitionTargets(locale: string): AcquisitionTargets {
  return {
    shopify: {
      path: 'shopify',
      kind: 'external',
      href: SHOPIFY_APP_STORE_LISTING_URL,
    },
    standalone: {
      path: 'standalone',
      kind: 'internal',
      href: withLocale('/signup', locale),
    },
  }
}

/**
 * Where a start-route card leads: Shopify to the App Store, every other route
 * to the account form with that order source already chosen.
 */
export function getStartRouteTarget(
  route: StartRoute,
  locale: string
): AcquisitionTarget {
  if (route.kind === 'external') return getAcquisitionTargets(locale).shopify

  const search = new URLSearchParams({ source: route.id })
  return {
    path: 'standalone',
    kind: 'internal',
    href: `${withLocale('/signup', locale)}?${search.toString()}`,
  }
}
