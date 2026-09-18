import {
  DARK_CLASS_NAME,
  DARK_SCHEME_MEDIA_QUERY,
  type ResolvedTheme,
} from './theme.model'

/** Reflect the resolved theme on <html>; CSS tokens do the rest. */
export function applyResolvedTheme(theme: ResolvedTheme): void {
  document.documentElement.classList.toggle(DARK_CLASS_NAME, theme === 'dark')
}

export function getSystemPrefersDark(): boolean {
  return window.matchMedia(DARK_SCHEME_MEDIA_QUERY).matches
}

/** `useSyncExternalStore`-compatible subscription to the OS colour scheme. */
export function subscribeToSystemTheme(listener: () => void): () => void {
  const query = window.matchMedia(DARK_SCHEME_MEDIA_QUERY)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
