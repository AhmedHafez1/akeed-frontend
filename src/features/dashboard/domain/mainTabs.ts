export type MainTabId = 'metrics' | 'confirmations'

export const MAIN_TABS: MainTabId[] = ['metrics', 'confirmations']

export function resolveMainTab(tabParam: string | null | undefined): MainTabId {
  if (!tabParam) {
    return 'confirmations'
  }

  if (MAIN_TABS.includes(tabParam as MainTabId)) {
    return tabParam as MainTabId
  }

  return 'confirmations'
}
