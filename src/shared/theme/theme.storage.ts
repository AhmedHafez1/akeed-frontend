import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isTheme,
  type Theme,
} from './theme.model'

type Listener = () => void

const listeners = new Set<Listener>()

/**
 * Holds the choice for this session when localStorage is unavailable
 * (private mode, blocked storage), so the toggle still works.
 */
let sessionTheme: Theme = DEFAULT_THEME

/**
 * Read the persisted preference. Falls back to the session value when storage
 * is unavailable, and to the default when it is empty or holds junk.
 */
export function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return sessionTheme
  }
}

export function writeStoredTheme(theme: Theme): void {
  sessionTheme = theme

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore localStorage failures; `sessionTheme` keeps the choice alive.
  }

  listeners.forEach((listener) => listener())
}

/**
 * `useSyncExternalStore`-compatible subscription. Fires for changes made in
 * this tab (via `writeStoredTheme`) and in other tabs (`storage` event).
 */
export function subscribeToStoredTheme(listener: Listener): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === THEME_STORAGE_KEY) listener()
  }

  listeners.add(listener)
  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}
