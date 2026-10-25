import { withLocale } from '@/shared/lib/locale'

export type TipType = 'tip' | 'update'
export type TipActionMode = 'embedded' | 'standalone'

/** The pages a tip's button may open; mirrors the backend catalog. */
export type TipActionRoute =
  | 'settings_message'
  | 'settings_timing'
  | 'plan'
  | 'verifications'
  | 'settings_store'
  | 'settings_api_keys'
  | 'imports_new'

export type TipCardAction =
  | { kind: 'internal'; route: TipActionRoute; label: string }
  | { kind: 'external'; url: string; label: string }

export interface TipCard {
  id: string
  type: TipType
  /** The language the card is written in; may be the English fallback. */
  locale: string
  title: string
  description: string
  action: TipCardAction | null
  published_at: string
}

export interface TipCardsResponse {
  cards: TipCard[]
  can_dismiss: boolean
}

export type TipEvent = 'view' | 'click' | 'dismiss'

interface TipTarget {
  path: string
  params?: Record<string, string>
}

/**
 * Where each button key leads in each mode. A key missing from a mode shows
 * no button there, so a campaign never links to a page the merchant lacks.
 */
export const TIP_ACTION_TARGETS: Record<
  TipActionRoute,
  Partial<Record<TipActionMode, TipTarget>>
> = {
  settings_message: {
    embedded: { path: '/settings', params: { tab: 'message' } },
    standalone: { path: '/settings', params: { tab: 'message' } },
  },
  settings_timing: {
    embedded: { path: '/settings', params: { tab: 'timing' } },
    standalone: { path: '/settings', params: { tab: 'timing' } },
  },
  plan: {
    embedded: { path: '/settings', params: { tab: 'plan' } },
    standalone: { path: '/billing' },
  },
  verifications: {
    embedded: { path: '/dashboard', params: { tab: 'confirmations' } },
    standalone: { path: '/verifications' },
  },
  settings_store: {
    standalone: { path: '/settings', params: { tab: 'store' } },
  },
  settings_api_keys: {
    standalone: { path: '/settings', params: { tab: 'api-keys' } },
  },
  imports_new: { standalone: { path: '/imports/new' } },
}

/** Dashboard view state that must not follow the merchant to another page. */
const VIEW_PARAMS = ['tab', 'range', 'filter', 'period', 'import']

/**
 * The in-app link for a button key. Embedded links keep the current query
 * (shop, host and the rest of the Shopify context); standalone links start
 * clean. Returns null when the page does not exist in this mode.
 */
export function resolveTipHref(
  route: string,
  mode: TipActionMode,
  locale: string,
  currentSearch: string
): string | null {
  const target = TIP_ACTION_TARGETS[route as TipActionRoute]?.[mode]
  if (!target) return null
  const search = new URLSearchParams(mode === 'embedded' ? currentSearch : '')
  for (const key of VIEW_PARAMS) search.delete(key)
  for (const [key, value] of Object.entries(target.params ?? {})) {
    search.set(key, value)
  }
  const query = search.toString()
  return `${withLocale(target.path, locale)}${query ? `?${query}` : ''}`
}

/** Only absolute HTTPS links open; anything else renders no button. */
export function isSafeExternalUrl(url: string): boolean {
  if (!url.toLowerCase().startsWith('https://')) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password
  } catch {
    return false
  }
}
