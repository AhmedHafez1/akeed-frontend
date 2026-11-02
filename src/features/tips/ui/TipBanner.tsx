'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSeenOnce } from '@/shared/hooks/useSeenOnce'
import { getLocaleDirection } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { akButton, akLink, akPill, notify } from '@/shared/ui'
import { useTipCards, type TipCardView } from '../domain/useTipCards'
import { TIP_TYPE_BADGES } from './TipCard'

export interface TipBannerProps {
  view: TipCardView
  canDismiss: boolean
  onSeen: (id: string) => void
  onAction: (id: string) => void
  onDismiss: (id: string) => void
  className?: string
}

/**
 * A tip flagged by the admin as a banner: one line with its type, title and
 * button. The description stays in the tips section. The × is the same
 * account-wide dismissal as the card's, so viewers get none.
 */
export function TipBanner({
  view,
  canDismiss,
  onSeen,
  onAction,
  onDismiss,
  className,
}: TipBannerProps) {
  const t = useTranslations('tips')
  const ref = useRef<HTMLElement>(null)
  const { card, link } = view
  const { icon: BadgeIcon, tone } = TIP_TYPE_BADGES[card.type]
  useSeenOnce(ref, () => onSeen(card.id))

  return (
    <aside
      ref={ref}
      aria-label={t('bannerLabel')}
      className={cn(
        'rounded-ak-card border-line bg-card text-ink flex h-11 min-w-0 items-center gap-2 border px-3 py-1 sm:gap-3',
        className
      )}
    >
      <span className={akPill({ tone })}>
        <BadgeIcon aria-hidden="true" className="size-3.5" />
        {t(`badge.${card.type}`)}
      </span>
      <div
        lang={card.locale}
        dir={getLocaleDirection(card.locale)}
        className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
      >
        <p
          title={card.title}
          className="text-ak-body min-w-0 flex-1 truncate font-semibold"
        >
          {card.title}
        </p>
        {link?.kind === 'internal' && (
          <Link
            href={link.href}
            onClick={() => onAction(card.id)}
            className={cn(
              akLink,
              'text-ak-caption max-w-[45%] min-w-0 shrink-0'
            )}
          >
            <span className="truncate">{link.label}</span>
          </Link>
        )}
        {link?.kind === 'external' && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.label} (${t('opensInNewTab')})`}
            onClick={() => onAction(card.id)}
            className={cn(
              akLink,
              'text-ak-caption max-w-[45%] min-w-0 shrink-0'
            )}
          >
            <span className="truncate">{link.label}</span>
            <ExternalLink
              aria-hidden="true"
              className="size-3.5 shrink-0 rtl:-scale-x-100"
            />
          </a>
        )}
      </div>
      {canDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(card.id)}
          aria-label={t('dismiss', { title: card.title })}
          title={t('dismiss', { title: card.title })}
          className={cn(
            akButton({ variant: 'ghost', size: 'iconTable' }),
            '-me-2'
          )}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </aside>
  )
}

/**
 * The standalone banner slot for a page: the newest flagged tip, or nothing
 * while loading, on error, or when no tip is flagged.
 */
export function TipBannerSlot({ className }: { className?: string }) {
  const t = useTranslations('tips')
  const tips = useTipCards({
    mode: 'standalone',
    onDismissError: () =>
      notify.error({ message: t('dismissError'), id: 'tips-dismiss-error' }),
  })
  if (!tips.banner) return null
  return (
    <TipBanner
      // A new banner is a new element, so its view is counted on its own.
      key={tips.banner.card.id}
      view={tips.banner}
      canDismiss={tips.canDismiss}
      onSeen={tips.onSeen}
      onAction={tips.onAction}
      onDismiss={tips.onDismiss}
      className={className}
    />
  )
}
