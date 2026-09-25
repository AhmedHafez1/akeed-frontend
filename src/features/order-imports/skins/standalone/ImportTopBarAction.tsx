'use client'

import { useId, type MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { withLocale, type SupportedLocale } from '@/shared/lib/locale'
import { Button } from '@/shared/ui'
import { importModalPath, withImportTarget } from '../../domain/importRoutes'
import { useBulkImportAvailability } from '../../domain/useBulkImportAvailability'

/**
 * "استيراد من ملف" in the top bar, beside the primary "تأكيد طلب". Labelled
 * from 1024px; an icon with a tooltip on tablets; a 44px icon on phones.
 * It opens the import modal over Verifications, keeping that list's filters
 * when the merchant is already there.
 */
export function ImportTopBarAction() {
  const t = useTranslations('orderImport.entry')
  const locale = useLocale() as SupportedLocale
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const tooltipId = useId()
  const availability = useBulkImportAvailability()
  if (availability !== 'enabled') return null

  const href = withLocale(importModalPath('new'), locale)
  const onVerifications = pathname === withLocale('/verifications', locale)

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onVerifications || event.metaKey || event.ctrlKey) return
    event.preventDefault()
    router.push(
      `${pathname}${withImportTarget(window.location.search, { kind: 'new' })}`,
      { scroll: false }
    )
  }

  return (
    <span className="group relative inline-flex">
      <Button
        asChild
        variant="outline"
        className="size-11 gap-2 rounded-lg px-0 sm:size-10 lg:w-auto lg:px-3.5"
      >
        <Link
          href={href}
          onClick={open}
          aria-label={t('newImport')}
          aria-describedby={tooltipId}
        >
          <Upload aria-hidden="true" className="size-[18px] shrink-0" />
          <span className="hidden lg:inline">{t('newImport')}</span>
        </Link>
      </Button>
      <span
        id={tooltipId}
        role="tooltip"
        className="rounded-control bg-foreground text-background shadow-overlay pointer-events-none absolute start-1/2 top-full z-50 mt-2 hidden w-max -translate-x-1/2 px-2.5 py-1.5 text-xs leading-5 font-medium sm:group-focus-within:block sm:group-hover:block lg:!hidden rtl:translate-x-1/2"
      >
        {t('newImport')}
      </span>
    </span>
  )
}
