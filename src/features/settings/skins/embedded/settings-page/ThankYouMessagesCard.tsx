'use client'

import { useId } from 'react'
import { Banner, BlockStack, Box, Card, Checkbox, Text } from '@shopify/polaris'
import { useLocale, useTranslations } from 'next-intl'
import { getLocaleDirection } from '@/shared/lib/locale'
import {
  thankYouPreview,
  type ThankYouMessagesProps,
} from '@/features/settings/domain/thankYouPreview'

export function ThankYouMessagesCard(props: ThankYouMessagesProps) {
  const t = useTranslations('settings.thankYou')
  const tLanguages = useTranslations('settings.embedded.message.languageNames')
  const locale = useLocale()
  const id = useId()
  const preview = thankYouPreview(props)
  if (!props.acknowledgment) return null
  const available = props.acknowledgment.available
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          {t('heading')}
        </Text>
        <BlockStack gap="200">
          <Checkbox
            label={t('label')}
            checked={props.checked}
            onChange={props.onChange}
            disabled={props.readOnly || (!available && !props.checked)}
            ariaDescribedBy={
              id +
              '-description ' +
              id +
              '-cost' +
              (!available ? ' ' + id + '-unavailable' : '')
            }
          />
          <span id={id + '-description'} className="sr-only">
            {t('description')}
          </span>
          <Text as="p" id={id + '-cost'} variant="bodySm" tone="subdued">
            {t('planCost')}
          </Text>
        </BlockStack>
        <Box
          borderBlockStartWidth="025"
          borderColor="border"
          paddingBlockStart="400"
        >
          <details>
            <summary style={{ cursor: 'pointer' }}>
              {t('examplesHeading')}
            </summary>
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <Text as="p" variant="bodySm" tone="subdued">
                  {t('description')}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {tLanguages(props.language)}
                </Text>
                {props.automaticStyle && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    {t('autoNote')}
                  </Text>
                )}
                {(['confirmed', 'canceled'] as const).map((outcome) => (
                  <BlockStack gap="200" key={outcome}>
                    <Text as="h3" variant="headingSm">
                      {t(outcome)}
                    </Text>
                    <Box
                      background="bg-surface-secondary"
                      borderColor="border"
                      borderWidth="025"
                      borderRadius="200"
                      padding="300"
                    >
                      <p
                        dir={
                          preview[outcome]
                            ? preview.direction
                            : getLocaleDirection(locale)
                        }
                        lang={preview[outcome] ? props.language : locale}
                        style={{
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'anywhere',
                          textAlign: 'start',
                          margin: 0,
                        }}
                      >
                        {preview[outcome] ?? t('textUnavailable')}
                      </p>
                    </Box>
                  </BlockStack>
                ))}
              </BlockStack>
            </Box>
          </details>
        </Box>
        {!available && (
          <div id={id + '-unavailable'} role="status">
            <Banner tone="warning">{t('unavailable')}</Banner>
          </div>
        )}
      </BlockStack>
    </Card>
  )
}
