'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { resolveEmbeddedContextFromWindow } from '@/shared/lib/embedded-context'

import { ThemeContext, type ThemeContextValue } from './theme.context'
import {
  applyResolvedTheme,
  getSystemPrefersDark,
  subscribeToSystemTheme,
} from './theme.dom'
import { DEFAULT_THEME, resolveTheme } from './theme.model'
import {
  readStoredTheme,
  subscribeToStoredTheme,
  writeStoredTheme,
} from './theme.storage'

const subscribeToNothing = () => () => {}
const isEmbeddedWindow = () => resolveEmbeddedContextFromWindow().isEmbedded

/*
 * Every input is an external store read through `useSyncExternalStore`, so the
 * server render and the hydration pass use the same fallbacks and there is no
 * effect-driven flicker or hydration mismatch. The no-flash script in <head>
 * has already set the class before this mounts; this keeps it in sync after.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToStoredTheme,
    readStoredTheme,
    () => DEFAULT_THEME
  )
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPrefersDark,
    () => false
  )
  // Polaris has no dark scheme, so embedded Shopify always renders light.
  const isEmbedded = useSyncExternalStore(
    subscribeToNothing,
    isEmbeddedWindow,
    () => false
  )

  const resolvedTheme = isEmbedded
    ? 'light'
    : resolveTheme(theme, systemPrefersDark)

  useEffect(() => {
    applyResolvedTheme(resolvedTheme)
  }, [resolvedTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme: writeStoredTheme }),
    [theme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
