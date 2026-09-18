'use client'

import { createContext, useContext } from 'react'

import type { ResolvedTheme, Theme } from './theme.model'

export interface ThemeContextValue {
  /** What the user chose, including `system`. */
  theme: Theme
  /** What is actually rendered right now. */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
