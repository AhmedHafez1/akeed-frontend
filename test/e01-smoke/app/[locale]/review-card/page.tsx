'use client'

import { AppProvider, BlockStack, Page, Text } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
import { ReviewPromptCard } from '@/features/dashboard/skins/embedded/components/ReviewPromptCard'

const noop = () => undefined
const RESULTS = { confirmed: 128, canceled: 14, since: '2026-09-03T08:00:00Z' }

/**
 * Every state of the embedded App Store review card, side by side, at the
 * dashboard's width. Check `/en/review-card` and `/ar/review-card` at 1280
 * and 390 px.
 */
export default function ReviewCardFixturePage() {
  const states = [
    ['Results', { status: 'card', results: RESULTS }],
    [
      'Results, nothing canceled',
      { status: 'card', results: { ...RESULTS, canceled: 0 } },
    ],
    ['Fallback', { status: 'card', results: null }],
    ['Thank you', { status: 'thanks', results: null }],
    ['Already reviewed', { status: 'reviewed', results: null }],
  ] as const
  return (
    <AppProvider i18n={enTranslations}>
      <div style={{ background: 'var(--p-color-bg)', minHeight: '100vh' }}>
        <Page fullWidth>
          <div className="mx-auto w-full max-w-330">
            <BlockStack gap="500">
              {states.map(([label, props]) => (
                <BlockStack key={label} gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    {label}
                  </Text>
                  <ReviewPromptCard
                    {...props}
                    requesting={false}
                    onRate={noop}
                    onNotNow={noop}
                    onSeeReview={noop}
                  />
                </BlockStack>
              ))}
            </BlockStack>
          </div>
        </Page>
      </div>
    </AppProvider>
  )
}
