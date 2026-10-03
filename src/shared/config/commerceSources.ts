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
