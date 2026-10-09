'use client'

import { BlockStack, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import {
  COMPACT_FEATURE_KEYS,
  SHARED_FEATURE_KEYS,
} from '@/features/billing/domain/planPresentation'
import { FeatureRow } from './FeatureRow'

interface SharedFeaturesListProps {
  /** The plan picker's shorter list. */
  compact?: boolean
}

/** The features every plan includes, stated once for all of them. */
export function SharedFeaturesList({
  compact = false,
}: SharedFeaturesListProps) {
  const t = useTranslations('billing.embeddedPlans')
  const keys = compact ? COMPACT_FEATURE_KEYS : SHARED_FEATURE_KEYS

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        {t('featuresTitle')}
      </Text>
      <ul className="m-0 grid list-none gap-x-6 gap-y-2 p-0 sm:grid-cols-2">
        {keys.map((key) => (
          <li key={key}>
            <FeatureRow feature={t(`features.${key}`)} />
          </li>
        ))}
      </ul>
    </BlockStack>
  )
}
