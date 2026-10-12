'use client'

import { Check, Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleSwitch } from '@/shared/hooks/useLocaleSwitch'
import { getLocaleNativeName, SUPPORTED_LOCALES } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui'

const defaultTriggerClassName =
  'border-border hover:bg-muted bg-card text-foreground/80 focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

interface LocaleToggleProps {
  className?: string
  /** Replaces the trigger's own look, for surfaces with their own controls. */
  triggerClassName?: string
}

/** Picks the interface language and reopens the same page in it. */
export function LocaleToggle({
  className,
  triggerClassName,
}: LocaleToggleProps) {
  const t = useTranslations('appHeader')
  const { locale, switchLocale } = useLocaleSwitch()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('changeLocale')}
          className={cn(triggerClassName ?? defaultTriggerClassName, className)}
          suppressHydrationWarning
        >
          <Globe aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span lang={locale}>{getLocaleNativeName(locale)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {SUPPORTED_LOCALES.map((option) => (
          <DropdownMenuItem
            key={option}
            lang={option}
            aria-current={option === locale ? 'true' : undefined}
            onSelect={() => switchLocale(option)}
            className="justify-between"
          >
            {getLocaleNativeName(option)}
            {option === locale && (
              <Check aria-hidden="true" className="text-primary h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
