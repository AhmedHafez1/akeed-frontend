export type SettingsTabId = 'message' | 'timing' | 'plan'

export const SETTINGS_TABS: SettingsTabId[] = ['message', 'timing', 'plan']

/**
 * Every `?tab=` value that has ever linked into Settings, mapped to the tab
 * that now holds its fields. The four-tab layout (store, confirmation,
 * message-preview, billing) and the older ids are kept so dashboard banners,
 * onboarding and bookmarked admin URLs keep landing in the right place.
 */
export const SETTINGS_TAB_ALIASES: Partial<Record<string, SettingsTabId>> = {
  store: 'message',
  settings: 'message',
  'message-preview': 'message',
  'message-template': 'message',
  templates: 'message',
  confirmation: 'timing',
  'confirmation-config': 'timing',
  automation: 'timing',
  billing: 'plan',
  subscription: 'plan',
}

export function resolveSettingsTab(
  tabParam: string | null | undefined
): SettingsTabId {
  if (!tabParam) {
    return 'message'
  }

  if (SETTINGS_TABS.includes(tabParam as SettingsTabId)) {
    return tabParam as SettingsTabId
  }

  return SETTINGS_TAB_ALIASES[tabParam] ?? 'message'
}

/** The standalone app has no plan tab; its third tab holds the order source. */
export type StandaloneSettingsTabId = 'message' | 'timing' | 'store'

export const STANDALONE_SETTINGS_TABS: StandaloneSettingsTabId[] = [
  'message',
  'timing',
  'store',
]

/** Where a standalone Settings URL leads: one of its tabs, or `/billing`. */
export type StandaloneSettingsDestination =
  | { kind: 'tab'; tab: StandaloneSettingsTabId }
  | { kind: 'billing' }

/**
 * Older standalone links: the `?section=` ids of the previous layout, the
 * Templates page, and the ids shared with the embedded app.
 */
const STANDALONE_SETTINGS_TAB_ALIASES: Partial<
  Record<string, StandaloneSettingsTabId>
> = {
  general: 'message',
  templates: 'message',
  'message-preview': 'message',
  automation: 'timing',
  confirmation: 'timing',
}

/** Standalone billing is credits on a page of its own, not a Settings tab. */
const STANDALONE_BILLING_PARAMS: readonly string[] = ['billing', 'plan']

/** `?tab=` wins; `?section=` is read only for links written before it. */
export function resolveStandaloneSettingsTab(params: {
  tab?: string | null
  section?: string | null
}): StandaloneSettingsDestination {
  const param = params.tab || params.section
  if (!param) return { kind: 'tab', tab: 'message' }
  if (STANDALONE_BILLING_PARAMS.includes(param)) return { kind: 'billing' }
  if (STANDALONE_SETTINGS_TABS.includes(param as StandaloneSettingsTabId)) {
    return { kind: 'tab', tab: param as StandaloneSettingsTabId }
  }
  return {
    kind: 'tab',
    tab: STANDALONE_SETTINGS_TAB_ALIASES[param] ?? 'message',
  }
}

/**
 * True when a standalone Settings URL needs no rewrite: no leftover
 * `?section=`, and `?tab=` either absent or one of the current tabs.
 */
export function isCanonicalStandaloneSettingsUrl(params: {
  tab?: string | null
  section?: string | null
}): boolean {
  if (params.section !== null && params.section !== undefined) return false
  return (
    params.tab === null ||
    params.tab === undefined ||
    STANDALONE_SETTINGS_TABS.includes(params.tab as StandaloneSettingsTabId)
  )
}

/** True when the URL already names a current tab, so no redirect is needed. */
export function isCanonicalSettingsTab(
  tabParam: string | null | undefined
): boolean {
  return (
    tabParam === null ||
    tabParam === undefined ||
    SETTINGS_TABS.includes(tabParam as SettingsTabId)
  )
}
