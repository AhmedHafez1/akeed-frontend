'use client'

import { ArrowUpRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { getOrderApiEndpoint } from '@/features/settings/api/integrationKeysApi'
import { useCopyToClipboard } from '@/features/settings/domain/useCopyToClipboard'
import { withLocale } from '@/shared/lib/locale'
import { createLogger } from '@/shared/lib/logger'
import { cn } from '@/shared/lib/utils'
import { akLink, akPill, notify } from '@/shared/ui'
import { settingsRowPadding } from './SettingsSection'

const logger = createLogger('Settings')

/**
 * What a developer needs once they hold a key: the address their server
 * sends orders to, and the guide that explains the request. Viewers see it
 * too, since neither is a secret.
 */
export function ApiConnectionGuide() {
  const t = useTranslations('settings.standalone.page.apiKeys.connect')
  const locale = useLocale()
  const endpoint = getOrderApiEndpoint()
  const { copied, copy } = useCopyToClipboard((error) => {
    logger.error('Failed to copy the order API address', error)
    notify.error({ message: t('copyError') })
  })

  return (
    <div
      className={cn(
        'border-line flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t',
        settingsRowPadding
      )}
    >
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <span className="text-ak-caption text-ink font-semibold">
          {t('endpointLabel')}
        </span>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span dir="ltr" className="flex min-w-0 items-center gap-1.5">
            <span className={cn(akPill({ tone: 'neutral' }), 'font-mono')}>
              POST
            </span>
            <code className="bg-neutral-soft text-ink text-ak-label rounded-md px-1.5 py-px font-mono font-normal break-all">
              {endpoint}
            </code>
          </span>
          <button
            type="button"
            onClick={() => void copy(endpoint)}
            className={cn(
              akLink,
              'text-ak-caption min-h-8 cursor-pointer px-1'
            )}
          >
            <span aria-live="polite">{copied ? t('copied') : t('copy')}</span>
          </button>
        </div>
      </div>
      <a
        href={withLocale('/docs/server-api', locale)}
        target="_blank"
        rel="noreferrer"
        className={cn(akLink, 'text-ak-caption min-h-8')}
      >
        {t('guideLink')}
        <ArrowUpRight
          aria-hidden="true"
          className="size-3.5 rtl:-scale-x-100"
        />
        <span className="sr-only">({t('newTab')})</span>
      </a>
    </div>
  )
}
