'use client'

import { InlineGrid } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { useTipCards } from '../../domain/useTipCards'
import { TipCardEmbedded } from './TipCardEmbedded'

/**
 * Tips and updates on the embedded dashboard, newest first. Renders nothing
 * while loading, on error, or when there is nothing to show.
 */
export function TipsSectionEmbedded({ enabled = true }: { enabled?: boolean }) {
  const t = useTranslations('tips')
  const { shopify } = useAkeedMode()
  const tips = useTipCards({
    mode: 'embedded',
    enabled,
    onDismissError: () =>
      shopify?.toast.show(t('dismissError'), { isError: true }),
  })
  if (!tips.cards.length) return null
  return (
    <section aria-label={t('sectionLabel')}>
      <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
        {tips.cards.map((view) => (
          <TipCardEmbedded
            key={view.card.id}
            view={view}
            canDismiss={tips.canDismiss}
            onSeen={tips.onSeen}
            onAction={tips.onAction}
            onDismiss={tips.onDismiss}
          />
        ))}
      </InlineGrid>
    </section>
  )
}
