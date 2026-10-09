'use client'

import { BlockStack, Card, Divider, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { USAGE_RULE_KEYS } from '@/features/billing/domain/planPresentation'

/** How the allowance is counted, renewed and what happens when it runs out. */
export function UsageRulesCard() {
  const t = useTranslations('billing.embeddedPlans')

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          {t('rulesTitle')}
        </Text>
        {USAGE_RULE_KEYS.map((key) => (
          <BlockStack key={key} gap="300">
            <Divider />
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div className="min-w-0 flex-[1_1_11rem]">
                <Text as="h3" variant="headingSm">
                  {t(`rules.${key}.label`)}
                </Text>
              </div>
              <div className="min-w-0 flex-[3_1_20rem]">
                <Text as="p">{t(`rules.${key}.body`)}</Text>
              </div>
            </div>
          </BlockStack>
        ))}
      </BlockStack>
    </Card>
  )
}
