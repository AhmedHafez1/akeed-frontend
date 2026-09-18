'use client'

import { useMemo } from 'react'

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { THEMES, type Theme } from './theme.model'

const THEME_ICONS: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export interface ThemeOption {
  value: Theme
  label: string
  Icon: LucideIcon
}

/** Localised labels + icons shared by every theme control. */
export function useThemeOptions(): ThemeOption[] {
  const t = useTranslations('theme')

  return useMemo(
    () =>
      THEMES.map((value) => ({
        value,
        label: t(value),
        Icon: THEME_ICONS[value],
      })),
    [t]
  )
}
