'use client'

import { useRef } from 'react'
import { Badge, Box, Button, InlineStack, Text } from '@shopify/polaris'
import { XIcon } from '@shopify/polaris-icons'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getLocaleDirection } from '@/shared/lib/locale'
import { useTipReadVisibility } from '../../domain/useTipReadVisibility'
import type { TipCardView } from '../../domain/useTipCards'
import { TYPE_TONES } from './TipEntryEmbedded'

export interface TipBannerEmbeddedProps {
  view: TipCardView | null
  canDismiss: boolean
  onSeen: (id: string, generation?: number) => void
  onAction: (id: string, generation?: number) => void
  onDismiss: (id: string, generation?: number) => void
}

/**
 * The newest tip flagged as a banner, as one line above the embedded page:
 * type, title, button and ×. It stays in the Tips & updates panel as well.
 * A view follows the panel's rule: two seconds at least half on screen.
 */
export function TipBannerEmbedded({ view, ...props }: TipBannerEmbeddedProps) {
  if (!view) return null
  // A new banner is a new element, so its view is counted on its own.
  return (
    <BannerLine
      key={view.card.id + ':' + (view.card.delivery_generation ?? 1)}
      view={view}
      {...props}
    />
  )
}

function BannerLine({
  view,
  canDismiss,
  onSeen,
  onAction,
  onDismiss,
}: TipBannerEmbeddedProps & { view: TipCardView }) {
  const t = useTranslations('tips')
  const router = useRouter()
  const seenRef = useRef<HTMLElement>(null)
  const { card, link } = view
  useTipReadVisibility(
    seenRef,
    () => onSeen(card.id, card.delivery_generation ?? 1),
    !card.first_viewed_at
  )

  return (
    <aside ref={seenRef} aria-label={t('bannerLabel')}>
      <Box
        background="bg-surface-secondary"
        borderColor="border"
        borderWidth="025"
        borderRadius="200"
        paddingInline="200"
        paddingBlock="100"
      >
        <InlineStack gap="200" blockAlign="center" wrap={false}>
          <Badge tone={TYPE_TONES[card.type]}>{t(`badge.${card.type}`)}</Badge>
          <div
            lang={card.locale}
            dir={getLocaleDirection(card.locale)}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <div title={card.title} className="min-w-0 flex-1">
              <Text as="p" variant="bodyMd" fontWeight="semibold" truncate>
                {card.title}
              </Text>
            </div>
            {/* Polaris's unlayered button margins must not overlap this row's controls. */}
            {link?.kind === 'internal' && (
              <div className="max-w-[45%] min-w-0 shrink-0 [&_.Polaris-Button]:m-0! [&_.Polaris-Button]:max-w-full! [&_.Polaris-Text--root]:truncate!">
                <Button
                  variant="plain"
                  onClick={() => {
                    onAction(card.id, card.delivery_generation ?? 1)
                    router.push(link.href)
                  }}
                >
                  {link.label}
                </Button>
              </div>
            )}
            {link?.kind === 'external' && (
              <div className="max-w-[45%] min-w-0 shrink-0 [&_.Polaris-Button]:m-0! [&_.Polaris-Button]:max-w-full! [&_.Polaris-Text--root]:truncate!">
                <Button
                  variant="plain"
                  url={link.href}
                  target="_blank"
                  onClick={() =>
                    onAction(card.id, card.delivery_generation ?? 1)
                  }
                  accessibilityLabel={`${link.label} (${t('opensInNewTab')})`}
                >
                  {link.label}
                </Button>
              </div>
            )}
          </div>
          {canDismiss && (
            <Button
              variant="tertiary"
              icon={XIcon}
              accessibilityLabel={t('dismiss', { title: card.title })}
              onClick={() => onDismiss(card.id, card.delivery_generation ?? 1)}
            />
          )}
        </InlineStack>
      </Box>
    </aside>
  )
}
