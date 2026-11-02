'use client'

import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { akButton, notify } from '@/shared/ui'
import { useCreditModelNotice } from '../../domain/useCreditModelNotice'

/**
 * Tells a merchant who held credits before 1 credit became EGP 1 that their
 * balance number doubled at the same value. It stays until an owner or admin
 * dismisses it for the organization.
 */
export function CreditModelNoticeBanner() {
  const t = useTranslations('billing.creditModelNotice')
  const { isVisible, canDismiss, dismiss, isDismissing } =
    useCreditModelNotice()
  if (!isVisible) return null

  return (
    <div
      role="status"
      className="rounded-ak-card border-info-border bg-info-subtle text-info-subtle-foreground text-ak-body flex flex-col gap-3 border px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="flex min-w-0 flex-col gap-0.5">
          <span className="font-bold">{t('title')}</span>
          <span>{t('body')}</span>
          <span>{t('example')}</span>
        </p>
      </div>
      {canDismiss && (
        <button
          type="button"
          disabled={isDismissing}
          className={akButton({ variant: 'secondary', size: 'row' })}
          onClick={() =>
            dismiss(undefined, {
              onError: () => notify.error({ message: t('dismissFailed') }),
            })
          }
        >
          {t('dismiss')}
        </button>
      )}
    </div>
  )
}
