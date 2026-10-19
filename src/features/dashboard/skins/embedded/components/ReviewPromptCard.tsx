'use client'

import type { ReactNode } from 'react'
import {
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  Text,
  useBreakpoints,
} from '@shopify/polaris'
import { CheckCircleIcon, StarIcon, XCircleIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { getFormatLocale } from '@/shared/lib/locale'
import type {
  ReviewPromptResults,
  ReviewPromptStatus,
} from '../../../domain/useReviewPrompt'

interface ReviewPromptCardProps {
  status: ReviewPromptStatus
  /** The store's own results, or null for the plain request. */
  results: ReviewPromptResults | null
  requesting: boolean
  onRate: () => void
  onNotNow: () => void
  /** Opens the listing's reviews, for a store that already reviewed Akeed. */
  onSeeReview: () => void
}

/** Western digits in every locale, so counts read the same everywhere. */
function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(`${getFormatLocale(locale)}-u-nu-latn`).format(
    value
  )
}

/** Day and month in the UI language; the year only when it is not this one. */
function formatSince(iso: string, locale: string): string {
  const date = new Date(iso)
  const thisYear = date.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat(`${getFormatLocale(locale)}-u-nu-latn`, {
    day: 'numeric',
    month: 'long',
    ...(thisYear ? {} : { year: 'numeric' }),
  }).format(date)
}

/**
 * A Polaris Icon is a block with `margin: auto`, so as a bare flex item it
 * takes the row's free space and pushes its siblings away. This box shrinks to
 * the icon, which keeps it beside its text.
 */
function InlineIcon({
  source,
  tone,
}: {
  source: typeof CheckCircleIcon
  tone: 'success' | 'subdued'
}) {
  return (
    <Box as="span">
      <Icon source={source} tone={tone} />
    </Box>
  )
}

function StarBadge() {
  return (
    <Box
      background="bg-fill-success-secondary"
      borderRadius="200"
      padding="150"
    >
      <Icon source={StarIcon} tone="success" />
    </Box>
  )
}

/*
 * Every InlineStack here passes `align` explicitly. Polaris sets it as an
 * inherited CSS variable only when the prop is given, so a nested stack
 * without it takes the outer row's `space-between` and spreads its children.
 */

interface StatProps {
  icon: typeof CheckCircleIcon
  tone: 'success' | 'subdued'
  value: string
  label: string
  stacked: boolean
}

/** One count; the label sits beside the number, or under it on a phone. */
function Stat({ icon, tone, value, label, stacked }: StatProps) {
  const number = (
    <Text
      as="span"
      variant="headingXl"
      numeric
      tone={tone === 'success' ? 'success' : undefined}
    >
      <bdi>{value}</bdi>
    </Text>
  )
  const caption = (
    <Text as="span" tone="subdued">
      {label}
    </Text>
  )
  return (
    <InlineStack
      align="start"
      gap="200"
      blockAlign={stacked ? 'start' : 'center'}
      wrap={false}
    >
      <InlineIcon source={icon} tone={tone} />
      {stacked ? (
        <BlockStack gap="100">
          {number}
          {caption}
        </BlockStack>
      ) : (
        <InlineStack align="start" gap="200" blockAlign="center">
          {number}
          {caption}
        </InlineStack>
      )}
    </InlineStack>
  )
}

/**
 * The App Store review request on the embedded dashboard and confirmations
 * pages. It leads with what Akeed did for this store when there is enough to
 * show, offers one way in and one way out, and thanks the merchant in place.
 */
export function ReviewPromptCard({
  status,
  results,
  requesting,
  onRate,
  onNotNow,
  onSeeReview,
}: ReviewPromptCardProps) {
  const t = useTranslations('dashboard.reviewPrompt')
  const { locale } = useLocaleInfo()
  const { xsOnly } = useBreakpoints()

  if (status === 'hidden') return null

  if (status === 'thanks') {
    return (
      <Card>
        <div role="status">
          <InlineStack align="start" gap="200" blockAlign="center" wrap={false}>
            <InlineIcon source={CheckCircleIcon} tone="success" />
            <Text as="p">{t('thanks')}</Text>
          </InlineStack>
        </div>
      </Card>
    )
  }

  if (status === 'reviewed') {
    const message = (
      <InlineStack align="start" gap="200" blockAlign="center" wrap={false}>
        <InlineIcon source={CheckCircleIcon} tone="success" />
        <Text as="p">{t('alreadyReviewed')}</Text>
      </InlineStack>
    )
    const seeReview = (
      <Button variant="tertiary" onClick={onSeeReview} fullWidth={xsOnly}>
        {t('seeReview')}
      </Button>
    )
    return (
      <Card>
        <div role="status">
          {xsOnly ? (
            <BlockStack gap="300">
              {message}
              {seeReview}
            </BlockStack>
          ) : (
            <InlineStack align="space-between" blockAlign="center" gap="400">
              {message}
              {seeReview}
            </InlineStack>
          )}
        </div>
      </Card>
    )
  }

  const title = (
    <Text as="h2" variant="headingMd">
      {results ? t('title') : t('fallbackTitle')}
    </Text>
  )
  const since =
    results?.since != null ? (
      <Text as="span" tone="subdued">
        {t('since', { date: formatSince(results.since, locale) })}
      </Text>
    ) : null

  const stats: ReactNode[] = results
    ? [
        <Stat
          key="confirmed"
          icon={CheckCircleIcon}
          tone="success"
          value={formatCount(results.confirmed, locale)}
          label={t('confirmed', { count: results.confirmed })}
          stacked={xsOnly}
        />,
        results.canceled > 0 ? (
          <Stat
            key="canceled"
            icon={XCircleIcon}
            tone="subdued"
            value={formatCount(results.canceled, locale)}
            label={t('canceled', { count: results.canceled })}
            stacked={xsOnly}
          />
        ) : null,
      ].filter(Boolean)
    : []

  const ask = (
    <Text as="p" tone="subdued">
      {results ? t(xsOnly ? 'askMobile' : 'ask') : t('fallbackAsk')}
    </Text>
  )
  const cta = (
    <Button
      variant="primary"
      onClick={onRate}
      loading={requesting}
      fullWidth={xsOnly}
    >
      {t('cta')}
    </Button>
  )
  const later = (
    <Button
      variant="tertiary"
      onClick={onNotNow}
      disabled={requesting}
      fullWidth={xsOnly}
    >
      {t('later')}
    </Button>
  )

  if (xsOnly) {
    return (
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <InlineStack
              align="start"
              gap="200"
              blockAlign="center"
              wrap={false}
            >
              <StarBadge />
              {title}
            </InlineStack>
            {since}
          </BlockStack>
          {stats.length > 0 && (
            <InlineGrid columns={2} gap="400">
              {stats}
            </InlineGrid>
          )}
          {ask}
          <BlockStack gap="200">
            {cta}
            {later}
          </BlockStack>
        </BlockStack>
      </Card>
    )
  }

  return (
    <Card>
      <InlineStack align="space-between" blockAlign="center" gap="600">
        <BlockStack gap="300">
          <InlineStack align="start" gap="200" blockAlign="center">
            <StarBadge />
            {title}
            {since}
          </InlineStack>
          {stats.length > 0 && (
            <InlineStack align="start" gap="500" blockAlign="center">
              {stats.map((stat, index) =>
                index === 0 ? (
                  stat
                ) : (
                  <Box
                    key="divider"
                    borderInlineStartWidth="025"
                    borderColor="border"
                    paddingInlineStart="500"
                  >
                    {stat}
                  </Box>
                )
              )}
            </InlineStack>
          )}
          {ask}
        </BlockStack>
        <InlineStack align="end" gap="200" blockAlign="center">
          {later}
          {cta}
        </InlineStack>
      </InlineStack>
    </Card>
  )
}
