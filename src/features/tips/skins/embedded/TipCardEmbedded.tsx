'use client'

import { useRef } from 'react'
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { XIcon } from '@shopify/polaris-icons'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useSeenOnce } from '@/shared/hooks/useSeenOnce'
import { getLocaleDirection } from '@/shared/lib/locale'
import type { TipCardView } from '../../domain/useTipCards'

export interface TipCardEmbeddedProps {
  view: TipCardView
  canDismiss: boolean
  onSeen: (id: string) => void
  onAction: (id: string) => void
  onDismiss: (id: string) => void
}

/** One tip or feature update on the embedded Shopify dashboard. */
export function TipCardEmbedded({
  view,
  canDismiss,
  onSeen,
  onAction,
  onDismiss,
}: TipCardEmbeddedProps) {
  const t = useTranslations('tips')
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const { card, link } = view
  useSeenOnce(ref, () => onSeen(card.id))

  return (
    <div ref={ref}>
      <Card>
        <BlockStack gap="300">
          <InlineStack
            align="space-between"
            blockAlign="start"
            gap="200"
            wrap={false}
          >
            <Badge tone={card.type === 'update' ? 'info' : 'success'}>
              {t(`badge.${card.type}`)}
            </Badge>
            {canDismiss && (
              <Button
                variant="tertiary"
                icon={XIcon}
                accessibilityLabel={t('dismiss', { title: card.title })}
                onClick={() => onDismiss(card.id)}
              />
            )}
          </InlineStack>
          <div lang={card.locale} dir={getLocaleDirection(card.locale)}>
            <BlockStack gap="200" inlineAlign="start">
              <Text as="h3" variant="headingSm" breakWord>
                <span className="whitespace-pre-line">{card.title}</span>
              </Text>
              <Text as="p" tone="subdued" breakWord>
                <span className="whitespace-pre-line">{card.description}</span>
              </Text>
              {link?.kind === 'internal' && (
                <Box paddingBlockStart="100">
                  <Button
                    onClick={() => {
                      onAction(card.id)
                      router.push(link.href)
                    }}
                  >
                    {link.label}
                  </Button>
                </Box>
              )}
              {link?.kind === 'external' && (
                <Box paddingBlockStart="100">
                  <Button
                    url={link.href}
                    target="_blank"
                    onClick={() => onAction(card.id)}
                    accessibilityLabel={`${link.label} (${t('opensInNewTab')})`}
                  >
                    {link.label}
                  </Button>
                </Box>
              )}
            </BlockStack>
          </div>
        </BlockStack>
      </Card>
    </div>
  )
}
