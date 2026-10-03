'use client'

import { Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { LoadingButton, StatusBadge } from '@/shared/ui'
import { remoteSyncView } from '@/features/dashboard/domain/remoteSync'
import { formatTooltipDateTime } from '@/features/dashboard/domain/verificationRow'
import type { VerificationItem } from '@/features/dashboard/model/dashboard.model'

/**
 * Whether the store has the order's result, shown apart from the result
 * itself: the history above is what the customer or the merchant decided, and
 * this is only whether the store was told. Renders nothing for a source that
 * reports no sync.
 */
export function StoreSyncSection({
  verification,
  timeZone,
  canRetry,
  isRetrying,
  onRetry,
}: {
  verification: VerificationItem
  timeZone: string
  canRetry: boolean
  isRetrying: boolean
  onRetry?: (verification: VerificationItem) => void
}) {
  const t = useTranslations('dashboard.table.storeSync')
  const { locale } = useLocaleInfo()
  const view = remoteSyncView(verification)
  if (!view) return null
  const updatedAt = formatTooltipDateTime(view.updatedAt, locale, timeZone)

  return (
    <section
      aria-labelledby="verification-store-sync-title"
      className="border-border rounded-xl border p-4 text-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="verification-store-sync-title"
          className="text-foreground flex items-center gap-2 font-semibold"
        >
          <Store aria-hidden="true" className="size-4" />
          {t('title')}
        </h3>
        <StatusBadge kind={view.badge} icon={false}>
          {t(view.labelKey)}
        </StatusBadge>
      </div>
      <p className="text-muted-foreground mt-2 text-xs leading-5">
        {t('separate')}
      </p>
      {view.guidanceKey && (
        <p className="text-foreground mt-2 leading-6">{t(view.guidanceKey)}</p>
      )}
      {updatedAt && (
        <p className="text-muted-foreground mt-2 text-xs">
          {t('updatedAt', { time: updatedAt })}
        </p>
      )}
      {view.canRetry && canRetry && onRetry && (
        <LoadingButton
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          loading={isRetrying}
          loadingText={t('retrying')}
          onClick={() => onRetry(verification)}
        >
          {t('retry')}
        </LoadingButton>
      )}
    </section>
  )
}
