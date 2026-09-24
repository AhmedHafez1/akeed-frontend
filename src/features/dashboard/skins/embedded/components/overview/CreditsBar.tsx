import { useId } from 'react'
import { Box, Button, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { DashboardOverview } from '../../../../model/dashboard.model'

/**
 * Plan usage, shown only from 80%: amber while messages remain, critical once
 * they are gone and confirmations have stopped.
 */
export function CreditsBar({
  usage,
  onChoosePlan,
}: {
  usage: NonNullable<DashboardOverview['usage']>
  onChoosePlan: () => void
}) {
  const t = useTranslations('dashboard.overview.credits')
  const labelId = useId()
  const exhausted = usage.state === 'exhausted'
  if (usage.state === 'ok') return null

  return (
    <Box
      background={exhausted ? 'bg-surface-critical' : 'bg-surface-warning'}
      borderColor={exhausted ? 'border-critical' : 'border-caution'}
      borderWidth="025"
      borderRadius="300"
      padding="400"
    >
      <div
        className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6"
        role={exhausted ? 'alert' : 'status'}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Text
            as="p"
            id={labelId}
            variant="bodyMd"
            fontWeight="semibold"
            tone={exhausted ? 'critical' : 'caution'}
          >
            {exhausted
              ? t('exhausted', { limit: usage.limit })
              : t('warning', { used: usage.used, limit: usage.limit })}
          </Text>
          <div
            role="progressbar"
            aria-labelledby={labelId}
            aria-valuemin={0}
            aria-valuemax={usage.limit}
            aria-valuenow={Math.min(usage.used, usage.limit)}
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--p-color-bg-fill-secondary)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${usage.percent}%`,
                background: exhausted
                  ? 'var(--p-color-bg-fill-critical)'
                  : 'var(--p-color-icon-warning)',
              }}
            />
          </div>
        </div>
        <div className="shrink-0">
          <Button variant="primary" onClick={onChoosePlan}>
            {t('cta')}
          </Button>
        </div>
      </div>
    </Box>
  )
}
