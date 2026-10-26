'use client'

import { useId, type Ref } from 'react'
import Link from 'next/link'
import { ExternalLink, Lightbulb, Sparkles, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getLocaleDirection } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { akButton, akCard, akLink, akPill } from '@/shared/ui'
import type { TipLink } from '../domain/useTipCards'
import type { TipCard as TipCardModel } from '../model/tips.model'

export interface TipCardProps {
  card: Pick<TipCardModel, 'type' | 'locale' | 'title' | 'description'>
  link: TipLink | null
  canDismiss: boolean
  onDismiss?: () => void
  onAction?: () => void
  ref?: Ref<HTMLElement>
}

/**
 * One tip or feature update on the standalone dashboard. It only renders:
 * tracking lives in the section, so the admin preview reuses it safely. The
 * content carries its own language and direction, so an English fallback
 * reads correctly inside an Arabic page.
 */
export function TipCard({
  card,
  link,
  canDismiss,
  onDismiss,
  onAction,
  ref,
}: TipCardProps) {
  const t = useTranslations('tips')
  const titleId = useId()
  const BadgeIcon = card.type === 'update' ? Sparkles : Lightbulb

  return (
    <article
      ref={ref}
      aria-labelledby={titleId}
      className={cn(akCard, 'flex min-w-0 flex-col gap-3 p-5')}
    >
      <div className="flex items-start gap-3">
        <span
          className={akPill({
            tone: card.type === 'update' ? 'info' : 'brand',
          })}
        >
          <BadgeIcon aria-hidden="true" className="size-3.5" />
          {t(`badge.${card.type}`)}
        </span>
        {canDismiss && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t('dismiss', { title: card.title })}
            title={t('dismiss', { title: card.title })}
            className={cn(
              akButton({ variant: 'ghost', size: 'iconTable' }),
              'ms-auto -me-2 -mt-1.5'
            )}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>
      <div
        lang={card.locale}
        dir={getLocaleDirection(card.locale)}
        className="flex min-w-0 flex-col gap-2"
      >
        <h3
          id={titleId}
          className="text-ak-body text-ink font-semibold break-words whitespace-pre-line"
        >
          {card.title}
        </h3>
        <p className="text-ak-body text-ink-muted break-words whitespace-pre-line">
          {card.description}
        </p>
        {link?.kind === 'internal' && (
          <Link
            href={link.href}
            onClick={onAction}
            className={cn(akLink, 'mt-1 self-start whitespace-normal')}
          >
            {link.label}
          </Link>
        )}
        {link?.kind === 'external' && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onAction}
            className={cn(akLink, 'mt-1 self-start whitespace-normal')}
          >
            {link.label}
            <ExternalLink
              aria-hidden="true"
              className="size-3.5 rtl:-scale-x-100"
            />
            <span className="sr-only">{t('opensInNewTab')}</span>
          </a>
        )}
      </div>
    </article>
  )
}
