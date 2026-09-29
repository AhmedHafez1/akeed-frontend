import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { StatusBadge, akCard } from '@/shared/ui'

/**
 * Where results will show up, before there are any: one line and the three
 * outcomes a merchant will see, as example badges.
 */
export function FirstRunConfirmationsCard() {
  const t = useTranslations('dashboard.firstRun.confirmations')
  return (
    <section
      aria-labelledby="first-run-confirmations-title"
      className={cn(
        akCard,
        'flex flex-col gap-4 p-5 text-start sm:flex-row sm:items-center sm:justify-between sm:p-8'
      )}
    >
      <div className="space-y-1">
        <h2
          id="first-run-confirmations-title"
          className="text-ink text-lg font-bold"
        >
          {t('title')}
        </h2>
        <p className="text-ink-muted text-sm">{t('empty')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="sr-only">{t('examplesLabel')}</span>
        <StatusBadge kind="pending" size="md">
          {t('examples.sent')}
        </StatusBadge>
        <StatusBadge kind="confirmed" size="md">
          {t('examples.confirmed')}
        </StatusBadge>
        <StatusBadge kind="canceled" size="md">
          {t('examples.canceled')}
        </StatusBadge>
      </div>
    </section>
  )
}
