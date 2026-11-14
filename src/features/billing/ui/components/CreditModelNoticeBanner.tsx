'use client'

import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { InfoHint, akButton, notify } from '@/shared/ui'
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
      className="rounded-ak-card border-info-border bg-info-subtle text-info-subtle-foreground text-ak-body flex flex-col gap-3 border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Info aria-hidden="true" className="size-5 shrink-0" />
        <p className="min-w-0 font-bold">{t('title')}</p>
        <InfoHint
          label={t('title')}
          content={
            <span className="block space-y-1">
              <span className="block">{t('body')}</span>
              <span className="block">{t('example')}</span>
            </span>
          }
        />
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
