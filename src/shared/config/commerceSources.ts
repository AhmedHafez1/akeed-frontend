/**
 * Where a new merchant's orders come from, chosen at signup, before the
 * organization exists. `standalone` provisions the Standalone source with the
 * organization; a `connect` source creates the organization alone and its
 * install provisions the source, so nothing is converted later.
 *
 * Message keys live under `auth.signup.source.options.<id>`.
 */
export type OrganizationSourceMode = 'standalone' | 'connect'

export interface SignupSource {
  id: string
  organizationSourceMode: OrganizationSourceMode
}

export const DEFAULT_SIGNUP_SOURCE_ID = 'standalone'

const STANDALONE_SOURCE: SignupSource = {
  id: DEFAULT_SIGNUP_SOURCE_ID,
  organizationSourceMode: 'standalone',
}

/** Store platforms a merchant can connect, each behind its own switch. */
const CONNECTABLE_SOURCES: ReadonlyArray<SignupSource & { enabled: boolean }> =
  [
    {
      id: 'easyorders',
      organizationSourceMode: 'connect',
      enabled: process.env.NEXT_PUBLIC_EASYORDERS_CONNECT_ENABLED === 'true',
    },
    {
      id: 'woocommerce',
      organizationSourceMode: 'connect',
      enabled: process.env.NEXT_PUBLIC_WOOCOMMERCE_CONNECT_ENABLED === 'true',
    },
  ]

/** The sources offered at signup. One entry means there is nothing to pick. */
export function getSignupSources(): SignupSource[] {
  return [
    STANDALONE_SOURCE,
    ...CONNECTABLE_SOURCES.filter((source) => source.enabled).map(
      ({ id, organizationSourceMode }) => ({ id, organizationSourceMode })
    ),
  ]
}

/**
 * A way to start with Akeed, as the homepage and the first signup step list
 * them. `external` leaves for the Shopify App Store; `signup` creates an
 * Akeed account with that source.
 */
export interface StartRoute {
  id: string
  kind: 'external' | 'signup'
}

export const SHOPIFY_START_ROUTE_ID = 'shopify'

/** Display order of the connectable sources; any other id follows them. */
const START_ROUTE_ORDER = ['woocommerce', 'easyorders']

function startRouteRank(id: string): number {
  const rank = START_ROUTE_ORDER.indexOf(id)
  return rank < 0 ? START_ROUTE_ORDER.length : rank
}

/**
 * Every start route in display order: Shopify, the connectable sources that
 * are switched on, then no connected store. A switched-off source is absent.
 */
export function getStartRoutes(): StartRoute[] {
  const connectable = getSignupSources()
    .filter((source) => source.organizationSourceMode === 'connect')
    .sort((a, b) => startRouteRank(a.id) - startRouteRank(b.id))

  return [
    { id: SHOPIFY_START_ROUTE_ID, kind: 'external' },
    ...connectable.map(({ id }) => ({ id, kind: 'signup' as const })),
    { id: DEFAULT_SIGNUP_SOURCE_ID, kind: 'signup' },
  ]
}

/**
 * The source named by `?source=` on signup, or null when it is not one of the
 * sources offered now (Shopify and switched-off sources included).
 */
export function parseSignupSourceParam(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return getSignupSources().some((source) => source.id === value) ? value : null
}

/**
 * How the organization is provisioned for a source id saved at signup. An
 * unknown or switched-off id is Standalone, the default.
 */
export function resolveOrganizationSourceMode(
  signupSourceId: unknown,
  sources: readonly SignupSource[] = getSignupSources()
): OrganizationSourceMode {
  return (
    sources.find((source) => source.id === signupSourceId)
      ?.organizationSourceMode ?? 'standalone'
  )
}
