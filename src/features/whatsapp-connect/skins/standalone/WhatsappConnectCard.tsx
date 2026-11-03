'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'
import { ExternalLink, Loader2, MessageCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard, akLink } from '@/shared/ui'
import { useWhatsappConnectEntry } from '../../hooks/useWhatsappConnectEntry'
import { serverErrorKey } from '../../model/signupErrors'

/** Owner-only entry to connect the organization's own WhatsApp number. */
export function WhatsappConnectCard() {
  const t = useTranslations('whatsappConnect')
  const id = useId()
  const entry = useWhatsappConnectEntry()
  if (!entry.visible) return null

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={cn(akCard, 'space-y-4 px-4 py-4 sm:px-6')}
    >
      <div className="flex items-start gap-3.5">
        <span className="bg-brand-soft text-brand-ink rounded-ak-control flex size-8 shrink-0 items-center justify-center">
          <MessageCircle aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 id={`${id}-heading`} className="text-ak-section text-ink">
            {t('card.heading')}
          </h2>
          <p className="text-ak-body text-ink-muted">{t('card.description')}</p>
        </div>
      </div>
      <button
        type="button"
        className={akButton({ variant: 'tinted', size: 'md' })}
        onClick={entry.open}
        disabled={entry.status === 'opening'}
      >
        {entry.status === 'opening' ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <ExternalLink aria-hidden="true" className="rtl:-scale-x-100" />
        )}
        {entry.status === 'opening' ? t('card.opening') : t('card.action')}
      </button>
      <div role="status" aria-live="polite" className="text-ak-caption">
        {entry.status === 'opened' && (
          <p className="text-ink-muted">{t('card.opened')}</p>
        )}
        {entry.status === 'blocked' && entry.pendingUrl && (
          <p className="text-ink-muted">
            {t('card.blocked')}{' '}
            <a
              href={entry.pendingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={akLink}
            >
              {t('card.openLink')}
            </a>
          </p>
        )}
        {entry.status === 'failed' && (
          <p className="text-ak-warning font-semibold">
            {t(`errors.${serverErrorKey(entry.errorCode)}`)}
          </p>
        )}
      </div>
    </section>
  )
}
