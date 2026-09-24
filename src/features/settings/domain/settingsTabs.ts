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
