'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  getLocaleFromPathname,
  persistLocalePreference,
  type SupportedLocale,
} from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'

/** Switches between Arabic and English on the same page. */
export function LocaleToggle({ className }: { className?: string }) {
  const t = useTranslations('appHeader')
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname)

  const handleLocaleChange = () => {
    const newLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar'
    persistLocalePreference(newLocale)
    const segments = pathname.split('/')
    if (segments.length > 1) {
      segments[1] = newLocale
      // Keep the query: an open import modal or a list filter survives.
      router.push(`${segments.join('/') || '/'}${window.location.search}`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLocaleChange}
      aria-label={t('changeLocale')}
      className={cn(
        'border-border hover:bg-muted bg-card text-foreground/80 focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
      suppressHydrationWarning
    >
      <Globe aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{locale === 'ar' ? 'EN' : 'العربية'}</span>
    </button>
  )
}
