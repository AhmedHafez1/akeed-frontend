import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Phone } from 'lucide-react'

/**
 * The merchant skipped the free test during onboarding: a quiet reminder to
 * see the message on their own phone before a customer does.
 */
export function SkippedTestBanner({ action }: { action?: ReactNode }) {
  const t = useTranslations('dashboard.firstRun.skippedTest')
  return (
    <div
      role="status"
      className="border-ak-info/20 bg-ak-info-soft rounded-panel flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <Phone
          aria-hidden="true"
          className="text-ak-info mt-0.5 size-5 shrink-0"
        />
        <div className="space-y-0.5">
          <p className="text-ink font-semibold">{t('title')}</p>
          <p className="text-ink-muted text-sm">{t('body')}</p>
        </div>
      </div>
      {action && <div className="shrink-0 ps-8 sm:ps-0">{action}</div>}
    </div>
  )
}
