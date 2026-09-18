'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

import { useTheme } from './theme.context'
import { useThemeOptions } from './useThemeOptions'

/** Compact icon menu for app chrome. Shows what is rendered, sets what is chosen. */
export function ThemeToggle() {
  const t = useTranslations('theme')
  const { theme, resolvedTheme, setTheme } = useTheme()
  const options = useThemeOptions()
  const { Icon: ActiveIcon } =
    options.find((option) => option.value === resolvedTheme) ?? options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('label')}
          className="border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          suppressHydrationWarning
        >
          <ActiveIcon aria-hidden="true" className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map(({ value, label, Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon aria-hidden="true" className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {theme === value && (
              <Check aria-hidden="true" className="text-primary h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
