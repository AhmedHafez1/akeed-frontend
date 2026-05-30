export type SettingsTabId =
  | 'store'
  | 'confirmation'
  | 'message-preview'
  | 'billing'

export const SETTINGS_TABS: SettingsTabId[] = [
  'store',
  'confirmation',
  'message-preview',
  'billing',
]

export const SETTINGS_TAB_ALIASES: Partial<Record<string, SettingsTabId>> = {
  settings: 'store',
  'confirmation-config': 'confirmation',
  'message-template': 'message-preview',
}

export function resolveSettingsTab(
  tabParam: string | null | undefined
): SettingsTabId {
  if (!tabParam) {
    return 'store'
  }

  if (SETTINGS_TABS.includes(tabParam as SettingsTabId)) {
    return tabParam as SettingsTabId
  }

  return SETTINGS_TAB_ALIASES[tabParam] ?? 'store'
}
