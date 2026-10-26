import { SHOPIFY_APP_STORE_LISTING_URL } from '@/shared/lib/shopify-auth'
import type { MetaPixelFbq } from '@/shared/types/window.model'

/**
 * Browser-side Meta Pixel helpers. The Pixel itself is loaded once by
 * `MarketingScripts` (standalone only); every helper here is a no-op when it
 * is absent, so embedded mode, ad blockers and tests need no special casing.
 */

const ATTRIBUTION_STORAGE_KEY = 'akeed.landingAttribution'
const UTM_PREFIX = 'utm_'

interface LandingAttribution {
  utm: Record<string, string>
  fbclid?: string
  /** When the fbclid was seen, for the `fbc` value Meta expects. */
  fbclidAt?: number
}

function getFbq(): MetaPixelFbq | undefined {
  return typeof window === 'undefined' ? undefined : window.fbq
}

export function trackMetaCustomEvent(name: string): void {
  getFbq()?.('trackCustom', name)
}

/** A standard event the server also reports; `eventId` lets Meta dedupe. */
export function trackMetaEvent(name: string, eventId: string): void {
  getFbq()?.('track', name, {}, { eventID: eventId })
}

export function newMetaEventId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readStoredAttribution(): LandingAttribution {
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object' && 'utm' in parsed) {
      return parsed as LandingAttribution
    }
  } catch {
    // Storage blocked or corrupt: attribution is best effort.
  }
  return { utm: {} }
}

/**
 * Remembers the ad parameters the visitor landed with for the rest of the
 * session, so a Shopify link clicked two pages later still carries them. A
 * new set of UTMs replaces the old one (the latest ad click wins).
 */
export function captureLandingAttribution(search: string): void {
  const params = new URLSearchParams(search)
  const utm: Record<string, string> = {}
  params.forEach((value, key) => {
    if (key.startsWith(UTM_PREFIX) && value) utm[key] = value
  })
  const fbclid = params.get('fbclid') ?? undefined
  if (Object.keys(utm).length === 0 && !fbclid) return

  const stored = readStoredAttribution()
  const next: LandingAttribution = {
    utm: Object.keys(utm).length > 0 ? utm : stored.utm,
    fbclid: fbclid ?? stored.fbclid,
    fbclidAt: fbclid ? Date.now() : stored.fbclidAt,
  }
  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked: the current page's own parameters still apply below.
  }
}

/** The landing UTMs: the current URL's if it has any, else the session's. */
function currentUtmParams(): Record<string, string> {
  const utm: Record<string, string> = {}
  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (key.startsWith(UTM_PREFIX) && value) utm[key] = value
  })
  return Object.keys(utm).length > 0 ? utm : readStoredAttribution().utm
}

const LISTING_URL = new URL(SHOPIFY_APP_STORE_LISTING_URL)

/** The Akeed App Store listing itself (not its reviews pages). */
export function isShopifyInstallUrl(href: string): boolean {
  try {
    const url = new URL(href)
    return (
      url.hostname === LISTING_URL.hostname &&
      (url.pathname === LISTING_URL.pathname ||
        url.pathname === `${LISTING_URL.pathname}/`)
    )
  } catch {
    return false
  }
}

/**
 * Adds the landing UTMs to an App Store link so installs keep their ad
 * attribution. Parameters the link already has (such as `locale`) win.
 */
export function withUtmParams(href: string): string {
  const utm = currentUtmParams()
  if (Object.keys(utm).length === 0) return href
  const url = new URL(href)
  for (const [key, value] of Object.entries(utm)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value)
  }
  return url.toString()
}

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined
}

/**
 * The Pixel's browser and click IDs for the Conversions API. `_fbc` is only
 * set when the visitor arrived from an ad click; if the cookie is missing
 * (for example first-party cookies are off) it is rebuilt from the landing
 * `fbclid` in the format Meta documents.
 */
export function readMetaBrowserIds(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {}
  const fbp = readCookie('_fbp')
  let fbc = readCookie('_fbc')
  if (!fbc) {
    const { fbclid, fbclidAt } = readStoredAttribution()
    if (fbclid) fbc = `fb.1.${fbclidAt ?? Date.now()}.${fbclid}`
  }
  return { ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) }
}
