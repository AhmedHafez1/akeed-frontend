'use client'

import { Banner, BlockStack, Button, Card, Link, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useWhatsappConnectEntry } from '../../hooks/useWhatsappConnectEntry'
import { serverErrorKey } from '../../model/signupErrors'

/**
 * Owner-only entry to connect the store's own WhatsApp number. Meta's window
 * cannot open inside Shopify Admin's frame, so the action opens Akeed's
 * connect page in a new top-level tab.
 */
export function WhatsappConnectCard() {
  const t = useTranslations('whatsappConnect')
  const entry = useWhatsappConnectEntry()
  if (!entry.visible) return null

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          {t('card.heading')}
        </Text>
        <Text as="p" tone="subdued">
          {t('card.description')}
        </Text>
        <div>
          <Button
            onClick={entry.open}
            loading={entry.status === 'opening'}
            accessibilityLabel={t('card.action')}
          >
            {t('card.action')}
          </Button>
        </div>
        {entry.status === 'opened' && (
          <Text as="p" tone="subdued">
            {t('card.opened')}
          </Text>
        )}
        {entry.status === 'blocked' && entry.pendingUrl && (
          <Banner tone="info">
            <p>
              {t('card.blocked')}{' '}
              <Link url={entry.pendingUrl} target="_blank">
                {t('card.openLink')}
              </Link>
            </p>
          </Banner>
        )}
        {entry.status === 'failed' && (
          <Banner tone="warning">
            <p>{t(`errors.${serverErrorKey(entry.errorCode)}`)}</p>
          </Banner>
        )}
      </BlockStack>
    </Card>
  )
}
