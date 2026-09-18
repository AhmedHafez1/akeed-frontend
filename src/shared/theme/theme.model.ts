export const THEMES = ['light', 'dark', 'system'] as const
export type Theme = (typeof THEMES)[number]
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'akeed:theme'
export const DEFAULT_THEME: Theme = 'system'

/** The class Tailwind's `dark` variant and the `.dark` tokens key off. */
export const DARK_CLASS_NAME = 'dark'
export const DARK_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme)
}

export function resolveTheme(
  theme: Theme,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light'
  return theme
}
