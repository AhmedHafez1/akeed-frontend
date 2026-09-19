'use client'

import Link from 'next/link'
import { FileUp } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { Button } from '@/shared/ui'
import { useBulkImportAvailability } from '../../domain/useBulkImportAvailability'

/**
 * Temporary entry to the import wizard on the verifications header.
 * TODO(US-04.6-08): replaced by the sidebar item "Import orders"; remove.
 */
export function NewImportLink() {
  const t = useTranslations('orderImport.entry')
  const locale = useLocale()
  if (useBulkImportAvailability() !== 'enabled') return null
  return (
    <Button asChild variant="outline" className="h-10">
      <Link href={withLocale('/imports/new', locale)}>
        <FileUp aria-hidden="true" className="size-4" />
        {t('newImport')}
      </Link>
    </Button>
  )
}
