import { withLocale } from '@/shared/lib/locale'
import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'

/**
 * The two ways a visitor can start using Akeed.
 *
 * `shopify` installs the embedded app from the App Store, where Shopify also
 * presents its own subscription pricing. `standalone` creates a portal account;
 * its credit account starts `pending_approval`, so the landing page frames it as
 * early access rather than instant self-serve.
 */
export type AcquisitionPath = 'shopify' | 'standalone'

export const ACQUISITION_PATHS = ['shopify', 'standalone'] as const

export const DEFAULT_ACQUISITION_PATH: AcquisitionPath = 'shopify'

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

export function isAcquisitionPath(value: unknown): value is AcquisitionPath {
  return value === 'shopify' || value === 'standalone'
}
