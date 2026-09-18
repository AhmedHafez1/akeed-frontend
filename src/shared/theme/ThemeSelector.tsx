'use client'

import { useTranslations } from 'next-intl'

import { SegmentedControl } from '@/shared/ui/segmented-control'

import { useTheme } from './theme.context'
import { useThemeOptions } from './useThemeOptions'

/** Three-way Light / Dark / System control for settings pages. */
export function ThemeSelector({ className }: { className?: string }) {
  const t = useTranslations('theme')
  const { theme, setTheme } = useTheme()
  const options = useThemeOptions()

  return (
    <SegmentedControl
      aria-label={t('label')}
      className={className}
      options={options.map(({ value, label }) => ({ value, label }))}
      value={theme}
      onChange={setTheme}
    />
  )
}
