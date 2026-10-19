'use client'

import { Banner, BlockStack, Button, InlineStack, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { SHOPIFY_APP_STORE_REVIEW_URL } from '@/shared/lib/shopify-auth'
import { useReviewPrompt } from '../../../domain/useReviewPrompt'

/**
 * A neutral, skippable request for an App Store review, shown once staff
 * switch it on for the store. It only links to the listing: Shopify alone
 * knows whether a review was written, so nothing here claims one was.
 */
export function ReviewPromptBanner() {
  const t = useTranslations('dashboard.reviewPrompt')
  const { prompt, saving, failed, answer } = useReviewPrompt()
  if (!prompt) return null

  const writeReview = () => {
    // Opened inside the click, before any await, so no popup blocker stops it.
    window.open(SHOPIFY_APP_STORE_REVIEW_URL, '_blank', 'noopener,noreferrer')
    answer('review_clicked')
  }

  return (
    <Banner
      tone="info"
      title={t('title')}
      onDismiss={() => answer('dismissed')}
    >
      <BlockStack gap="300">
        <p>{t('message')}</p>
        {failed && (
          <div role="alert">
            <Text as="p" tone="critical">
              {t('saveFailed')}
            </Text>
          </div>
        )}
        <InlineStack gap="200" blockAlign="center">
          <Button variant="primary" onClick={writeReview} disabled={saving}>
            {t('writeReview')}
          </Button>
          <Button onClick={() => answer('snoozed')} disabled={saving}>
            {t('notNow')}
          </Button>
          <Button
            variant="plain"
            onClick={() => answer('dont_ask_again')}
            disabled={saving}
          >
            {t('dontAskAgain')}
          </Button>
        </InlineStack>
      </BlockStack>
    </Banner>
  )
}
