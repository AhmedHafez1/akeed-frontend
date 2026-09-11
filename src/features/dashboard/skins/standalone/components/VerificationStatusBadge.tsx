'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import type { VerificationItem } from '../../../model/dashboard.model'
import { lifecycleTone } from '../../../domain/verificationLifecycle'
import { lifecycleToneClasses } from '../lifecycleToneClasses'

/**
 * A row's lifecycle status, or — for an order the server has not listed yet —
 * what the UI is waiting on, with a spinner so it never reads as settled.
 */
export function VerificationStatusBadge({
  verification,
  className,
}: {
  verification: VerificationItem
  className?: string
}) {
  const t = useTranslations('dashboard')

  if (verification.optimistic) {
    return (
      <span
        title={t('table.optimistic.hint')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold',
          lifecycleToneClasses.neutral,
          className
        )}
      >
        <Loader2 aria-hidden="true" className="size-3 animate-spin" />
        {t(`table.optimistic.${verification.optimistic}`)}
        <span className="sr-only">{t('table.optimistic.hint')}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-md border px-2 py-1 text-xs font-semibold',
        lifecycleToneClasses[lifecycleTone(verification.status)],
        className
      )}
    >
      {t(`verificationStatus.${verification.status}`)}
    </span>
  )
}
