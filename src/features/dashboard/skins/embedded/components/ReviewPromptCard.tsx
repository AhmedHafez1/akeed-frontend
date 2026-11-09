'use client'

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
import { CheckCircleIcon, HeartIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { getFormatLocale } from '@/shared/lib/locale'
import type {
  ReviewPromptResults,
  ReviewPromptStatus,
} from '../../../domain/useReviewPrompt'
import styles from './ReviewPromptCard.module.css'

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

function HeartBadge() {
  return (
    <Box
      background="bg-fill-success-secondary"
      borderRadius="200"
      padding="200"
    >
      <Icon source={HeartIcon} tone="success" />
    </Box>
  )
}

/*
 * Every InlineStack here passes `align` explicitly. Polaris sets it as an
 * inherited CSS variable only when the prop is given, so a nested stack
 * without it takes the outer row's `space-between` and spreads its children.
 */

interface StatProps {
  tone: 'success' | 'subdued'
  value: string
  label: string
}

/** Store results support the invitation without competing with its heading. */
function Stat({ tone, value, label }: StatProps) {
  return (
    <BlockStack gap="150">
      <span className={styles.value}>
        <Text
          as="span"
          numeric
          tone={tone === 'success' ? 'success' : undefined}
        >
          <bdi>{value}</bdi>
        </Text>
      </span>
      <Text as="span" variant="bodySm" tone="subdued">
        {label}
      </Text>
    </BlockStack>
  )
}

/**
 * The App Store review request on the embedded dashboard and confirmations
 * pages. It invites an honest review, supports the request with store results,
 * and keeps the native review and dismissal behavior in place.
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
  const { smDown } = useBreakpoints()

  if (status === 'hidden') return null

  if (status === 'thanks') {
    return (
      <Card padding="500" roundedAbove="xs">
        <div role="status">
          <InlineStack align="start" gap="200" blockAlign="center" wrap={false}>
            <InlineIcon source={CheckCircleIcon} tone="success" />
            <BlockStack gap="100">
              <Text as="p">{t('thanks')}</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {t('thanksBody')}
              </Text>
            </BlockStack>
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
      <Button variant="tertiary" onClick={onSeeReview} fullWidth={smDown}>
        {t('seeReview')}
      </Button>
    )
    return (
      <Card padding="500" roundedAbove="xs">
        <div role="status">
          {smDown ? (
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

  return (
    <Card padding="500" roundedAbove="xs">
      <div
        className={results ? styles.layout : styles.plain}
        aria-busy={requesting}
      >
        <div className={styles.invitation}>
          <BlockStack gap="200">
            <InlineStack
              align="start"
              gap="300"
              blockAlign="start"
              wrap={false}
            >
              <HeartBadge />
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  {t('title')}
                </Text>
                <Text as="p" fontWeight="medium">
                  {t('thankYou')}
                </Text>
              </BlockStack>
            </InlineStack>
            <Text as="p" tone="subdued">
              {t('ask')}
            </Text>
          </BlockStack>
        </div>
        {results && (
          <div className={styles.results}>
            <BlockStack gap="400">
              <InlineStack align="space-between" gap="200" blockAlign="start">
                <Text as="p" variant="bodySm" fontWeight="medium">
                  {t('resultsTitle')}
                </Text>
                {results.since != null && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    {t('since', { date: formatSince(results.since, locale) })}
                  </Text>
                )}
              </InlineStack>
              <InlineGrid columns={results.canceled > 0 ? 2 : 1} gap="400">
                <Stat
                  tone="success"
                  value={formatCount(results.confirmed, locale)}
                  label={t('confirmed', { count: results.confirmed })}
                />
                {results.canceled > 0 && (
                  <Stat
                    tone="subdued"
                    value={formatCount(results.canceled, locale)}
                    label={t('canceled', { count: results.canceled })}
                  />
                )}
              </InlineGrid>
            </BlockStack>
          </div>
        )}
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="large"
            onClick={onRate}
            loading={requesting}
          >
            {t('cta')}
          </Button>
          <Button
            variant="tertiary"
            size="large"
            onClick={onNotNow}
            disabled={requesting}
          >
            {t('later')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
