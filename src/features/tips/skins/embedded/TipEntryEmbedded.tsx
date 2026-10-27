'use client'

import { useRef, type Ref } from 'react'
import {
  Badge,
  BlockStack,
  Box,
  Button,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useSeenOnce } from '@/shared/hooks/useSeenOnce'
import { getLocaleDirection } from '@/shared/lib/locale'
import type { TipCardView } from '../../domain/useTipCards'

export interface TipEntryEmbeddedProps {
  ref?: Ref<HTMLDivElement>
  view: TipCardView
  canDismiss: boolean
  onSeen: (id: string) => void
  onAction: (id: string) => void
  onDismiss: (id: string) => void
}

/**
 * One tip or feature update in the embedded Tips & updates panel. It mounts
 * only while the panel is open, so a view is recorded once at least half of
 * it is actually on screen, never because the header button exists.
 */
export function TipEntryEmbedded({
  ref,
  view,
  canDismiss,
  onSeen,
  onAction,
  onDismiss,
}: TipEntryEmbeddedProps) {
  const t = useTranslations('tips')
  const router = useRouter()
  const seenRef = useRef<HTMLDivElement>(null)
  const { card, link } = view
  useSeenOnce(seenRef, () => onSeen(card.id))

  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      <div ref={seenRef}>
        <BlockStack gap="200">
          <InlineStack align="start">
            <Badge tone={card.type === 'update' ? 'info' : 'success'}>
              {t(`badge.${card.type}`)}
            </Badge>
          </InlineStack>
          <div lang={card.locale} dir={getLocaleDirection(card.locale)}>
            <BlockStack gap="200" inlineAlign="start">
              <Text as="h3" variant="headingSm" breakWord>
                <span className="whitespace-pre-line">{card.title}</span>
              </Text>
              <Text as="p" tone="subdued" breakWord>
                <span className="whitespace-pre-line">{card.description}</span>
              </Text>
            </BlockStack>
          </div>
        </BlockStack>
        {(canDismiss || link) && (
          <Box paddingBlockStart="400">
            <InlineStack align="end" blockAlign="center" gap="200" wrap>
              {canDismiss && (
                <Button
                  variant="secondary"
                  accessibilityLabel={t('dismiss', { title: card.title })}
                  onClick={() => onDismiss(card.id)}
                >
                  {t('dismissLabel')}
                </Button>
              )}
              {link?.kind === 'internal' && (
                <div lang={card.locale} dir={getLocaleDirection(card.locale)}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      onAction(card.id)
                      router.push(link.href)
                    }}
                  >
                    {link.label}
                  </Button>
                </div>
              )}
              {link?.kind === 'external' && (
                <div lang={card.locale} dir={getLocaleDirection(card.locale)}>
                  <Button
                    variant="primary"
                    url={link.href}
                    target="_blank"
                    onClick={() => onAction(card.id)}
                    accessibilityLabel={`${link.label} (${t('opensInNewTab')})`}
                  >
                    {link.label}
                  </Button>
                </div>
              )}
            </InlineStack>
          </Box>
        )}
      </div>
    </div>
  )
}
