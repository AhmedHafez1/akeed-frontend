'use client'

import type { ReactNode } from 'react'
import { BlockStack, Divider, Icon, InlineStack, Text } from '@shopify/polaris'
import { CheckIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import {
  PER_MESSAGE_PRICE_DIGITS,
  formatMessageCount,
  isolateLtr,
  messagesPerDay,
  perMessagePrice,
} from '@/features/billing/domain/planPresentation'
import { formatPlanPrice } from '@/shared/lib/money'

interface PlanAllowanceSummaryProps {
  name: string
  amount: number
  currencyCode: string
  includedVerifications: number
  /** Prefix for the name (`-name`) and figures (`-details`) element ids. */
  id?: string
  /** Sits at the end of the name row: a badge, or the card's radio. */
  trailing?: ReactNode
  /** The plan puts the store logo on messages (Pro and up). */
  includesLogo?: boolean
}

/**
 * What a plan is, in the terms plans differ by: how many messages a month,
 * what that costs, and whether the store logo goes on messages. Prices and counts come from the API plan.
 */
export function PlanAllowanceSummary({
  name,
  amount,
  currencyCode,
  includedVerifications,
  id,
  trailing,
  includesLogo = false,
}: PlanAllowanceSummaryProps) {
  const t = useTranslations('billing.embeddedPlans')
  const perDay = messagesPerDay(includedVerifications)

  return (
    <BlockStack gap="400">
      <InlineStack align="space-between" blockAlign="center" gap="200">
        <Text as="h3" variant="headingMd" id={id && `${id}-name`}>
          {name}
        </Text>
        {trailing}
      </InlineStack>
      <div id={id && `${id}-details`}>
        <BlockStack gap="300">
          <BlockStack gap="050">
            <Text as="p" variant="heading2xl">
              <bdi>{formatMessageCount(includedVerifications)}</bdi>
            </Text>
            <Text as="p" tone="subdued">
              {t('allowance')}
              {' · '}
              {t('perDay', {
                count: perDay,
                formatted: formatMessageCount(perDay),
              })}
            </Text>
          </BlockStack>
          <Divider />
          <BlockStack gap="050">
            <InlineStack gap="150" blockAlign="baseline">
              <Text as="p" variant="headingMd">
                <bdi dir="ltr">{formatPlanPrice(amount, currencyCode)}</bdi>
              </Text>
              <Text as="span" tone="subdued">
                {t('perMonth')}
              </Text>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              {t('perMessage', {
                price: isolateLtr(
                  formatPlanPrice(
                    perMessagePrice(amount, includedVerifications),
                    currencyCode,
                    PER_MESSAGE_PRICE_DIGITS
                  )
                ),
              })}
            </Text>
          </BlockStack>
          {includesLogo && (
            <InlineStack gap="100" blockAlign="center" wrap={false}>
              <span className="shrink-0">
                <Icon source={CheckIcon} tone="success" />
              </span>
              <Text as="p" variant="bodySm">
                {t('logoIncluded')}
              </Text>
            </InlineStack>
          )}
        </BlockStack>
      </div>
    </BlockStack>
  )
}
