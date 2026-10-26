'use client'

import { BlockStack, Button, SkeletonBodyText, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatCount } from '../../../../lib/orderDisplay'
import type { MessageUsageView } from '../../../../model/messageUsage.model'

const FILL_BY_STATE = {
  ok: 'var(--p-color-bg-fill-brand)',
  warning: 'var(--p-color-bg-fill-warning)',
  exhausted: 'var(--p-color-bg-fill-critical)',
} as const

interface UsagePanelProps {
  view: MessageUsageView
  isRefreshing: boolean
  onRetry: () => void
  onChoosePlan: () => void
}

/**
 * The allowance in full: what it is, used of total, what is left and what
 * happens when it runs out, with one way to choose a plan. A failed read
 * keeps the last known numbers and says so; it never shows a false zero.
 */
export function UsagePanel({
  view,
  isRefreshing,
  onRetry,
  onChoosePlan,
}: UsagePanelProps) {
  const t = useTranslations('dashboard.headerTools.usage')
  const { locale } = useLocaleInfo()

  const retry = (
    <Button
      variant="plain"
      loading={isRefreshing}
      onClick={onRetry}
      accessibilityLabel={t('retryLabel')}
    >
      {t('retry')}
    </Button>
  )
  const choosePlan = (
    <div>
      <Button variant="primary" onClick={onChoosePlan}>
        {t('cta')}
      </Button>
    </div>
  )

  if (view.kind === 'loading') {
    return <SkeletonBodyText lines={3} />
  }

  if (view.kind === 'unavailable') {
    return (
      <BlockStack gap="300">
        <Text as="p" tone="subdued">
          {t('unavailable')}
        </Text>
        <div>{retry}</div>
        {choosePlan}
      </BlockStack>
    )
  }

  const allowanceLabel = t(`allowance.${view.allowance}`)
  const usedOf = t('usedOf', {
    used: formatCount(view.used, locale),
    limit: formatCount(view.limit, locale),
  })
  const exhausted = view.state === 'exhausted'
  const hasLimit = view.limit > 0
  // Below the warning threshold the counts are all a merchant needs; the
  // consequence and the plan action appear from 80%.
  const needsPlan = view.state !== 'ok'

  return (
    <BlockStack gap="300">
      <BlockStack gap="200">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Text as="p" fontWeight="semibold">
            {allowanceLabel}
          </Text>
          <Text as="p" tone="subdued">
            {usedOf}
          </Text>
        </div>
        {hasLimit && (
          <div
            role="progressbar"
            aria-label={allowanceLabel}
            aria-valuemin={0}
            aria-valuemax={view.limit}
            aria-valuenow={Math.min(view.used, view.limit)}
            aria-valuetext={usedOf}
            className="h-[5px] w-full overflow-hidden rounded-full"
            style={{ background: 'var(--p-color-bg-fill-secondary)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${view.fill}%`,
                background: FILL_BY_STATE[view.state],
              }}
            />
          </div>
        )}
      </BlockStack>
      {hasLimit && (
        <Text
          as="p"
          fontWeight="semibold"
          tone={
            exhausted
              ? 'critical'
              : view.state === 'warning'
                ? 'caution'
                : undefined
          }
        >
          {t('remaining', {
            count: view.remaining,
            formatted: formatCount(view.remaining, locale),
          })}
        </Text>
      )}
      {needsPlan && (
        <Text as="p" tone="subdued">
          {t(exhausted ? 'consequenceExhausted' : 'consequence')}
        </Text>
      )}
      {view.stale && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Text as="p" tone="caution">
            {t('stale')}
          </Text>
          {retry}
        </div>
      )}
      {needsPlan && choosePlan}
    </BlockStack>
  )
}
