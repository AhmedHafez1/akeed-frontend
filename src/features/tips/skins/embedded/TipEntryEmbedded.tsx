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
import { getLocaleDirection } from '@/shared/lib/locale'
import { useTipReadVisibility } from '../../domain/useTipReadVisibility'
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
 * only while the panel is open. A view requires two continuous seconds with
 * at least half the entry visible in an active browser tab.
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
  const unread = card.first_viewed_at === null
  useTipReadVisibility(seenRef, () => onSeen(card.id), !card.first_viewed_at)

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
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="shrink-0 rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: 'var(--p-color-icon-info)',
                    visibility: unread ? 'visible' : 'hidden',
                  }}
                />
                <Text as="h3" variant="headingSm" breakWord>
                  {unread && <span className="sr-only">{t('unread')}: </span>}
                  <span className="whitespace-pre-line">{card.title}</span>
                </Text>
              </div>
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
