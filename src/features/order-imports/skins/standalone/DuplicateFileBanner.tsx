'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { withLocale } from '@/shared/lib/locale'
import { Button } from '@/shared/ui'
import type { OrderImportDuplicateFile } from '../../api/orderImportsApi'
import { ImportNotice } from './ImportNotice'

/**
 * The same file was uploaded in the last 24 hours (story AC3). A warning,
 * not a refusal: continuing is allowed.
 */
export function DuplicateFileBanner({
  duplicate,
}: {
  duplicate: OrderImportDuplicateFile
}) {
  const t = useTranslations('orderImport.duplicate')
  const format = useFormatter()
  const locale = useLocale()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <ImportNotice
      tone="warning"
      role="status"
      title={t('banner', {
        time: format.relativeTime(new Date(duplicate.createdAt), new Date()),
      })}
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href={withLocale(`/imports/${duplicate.batchId}`, locale)}>
              {t('view')}
            </Link>
          </Button>
          <Button type="button" size="sm" onClick={() => setDismissed(true)}>
            {t('continue')}
          </Button>
        </>
      }
    />
  )
}
