'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useSeenOnce } from '@/shared/hooks/useSeenOnce'
import { cn } from '@/shared/lib/utils'
import { notify } from '@/shared/ui'
import { useTipCards, type TipCardView } from '../domain/useTipCards'
import { TipCard } from './TipCard'

function TrackedTipCard({
  view,
  canDismiss,
  onSeen,
  onAction,
  onDismiss,
}: {
  view: TipCardView
  canDismiss: boolean
  onSeen: (id: string) => void
  onAction: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const ref = useRef<HTMLElement>(null)
  const id = view.card.id
  useSeenOnce(ref, () => onSeen(id))
  return (
    <TipCard
      ref={ref}
      card={view.card}
      link={view.link}
      canDismiss={canDismiss}
      onAction={() => onAction(id)}
      onDismiss={() => onDismiss(id)}
    />
  )
}

/**
 * Tips and updates on the standalone dashboard, newest first. Renders nothing
 * while loading, on error, or when there is nothing to show.
 */
export function TipsSection({
  enabled = true,
  className,
}: {
  enabled?: boolean
  className?: string
}) {
  const t = useTranslations('tips')
  const tips = useTipCards({
    mode: 'standalone',
    enabled,
    onDismissError: () =>
      notify.error({ message: t('dismissError'), id: 'tips-dismiss-error' }),
  })
  if (!tips.cards.length) return null
  return (
    <section
      aria-label={t('sectionLabel')}
      className={cn('grid gap-4 md:grid-cols-2', className)}
    >
      {tips.cards.map((view) => (
        <TrackedTipCard
          key={view.card.id}
          view={view}
          canDismiss={tips.canDismiss}
          onSeen={tips.onSeen}
          onAction={tips.onAction}
          onDismiss={tips.onDismiss}
        />
      ))}
    </section>
  )
}
