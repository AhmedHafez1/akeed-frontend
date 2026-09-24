import { BlockStack, Card, Divider, Text } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { formatCount, formatPercent } from '../../../../lib/orderDisplay'
import type { DashboardOverview } from '../../../../model/dashboard.model'

type Funnel = DashboardOverview['funnel']

const TRACK = 'var(--p-color-bg-fill-secondary)'
const CONFIRMED = 'var(--p-color-bg-fill-success)'
const CANCELED = 'var(--p-color-bg-fill-critical)'
const NO_REPLY = 'var(--p-color-icon-disabled)'

function share(part: number, whole: number) {
  return whole > 0 ? `${Math.min((part / whole) * 100, 100)}%` : '0%'
}

function FlowRow({
  label,
  count,
  percent,
  sent,
  segments,
  showPercent,
}: {
  label: string
  count: number
  percent: number | null
  sent: number
  segments: Array<{ value: number; color: string }>
  showPercent: boolean
}) {
  const { locale } = useLocaleInfo()
  const percentText = formatPercent(percent, locale)

  return (
    <li className="grid grid-cols-[6.5rem_minmax(0,1fr)_5.5rem] items-center gap-4">
      <Text as="span" variant="bodyMd">
        {label}
      </Text>
      <div
        aria-hidden="true"
        className="flex h-6 w-full overflow-hidden rounded-md"
        style={{ background: TRACK }}
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className="h-full first:rounded-s-md last:rounded-e-md"
            style={{
              width: share(segment.value, sent),
              background: segment.color,
              marginInlineEnd: index < segments.length - 1 ? 2 : 0,
            }}
          />
        ))}
      </div>
      <Text as="span" variant="bodyMd" alignment="end">
        <bdi dir="ltr">
          {showPercent && (
            <span className="text-[var(--p-color-text-secondary)]">
              {percentText} ·{' '}
            </span>
          )}
          <span className="font-semibold">{formatCount(count, locale)}</span>
        </bdi>
      </Text>
    </li>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="inline-block size-2.5 rounded-sm"
        style={{ background: color }}
      />
      <Text as="span" variant="bodySm" tone="subdued">
        {label}
      </Text>
    </li>
  )
}

/**
 * Sent → delivered → read → replied, each bar scaled to what was sent. The
 * last bar splits into confirmed and canceled so the outcome is visible at a
 * glance.
 */
export function MessageFlowCard({ funnel }: { funnel: Funnel }) {
  const t = useTranslations('dashboard.overview.flow')
  const { locale } = useLocaleInfo()
  const sent = funnel.sent.count

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="100">
          <Text as="h2" variant="headingLg">
            {t('title')}
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            {t('subtitle')}
          </Text>
        </BlockStack>
        {sent === 0 ? (
          <Text as="p" variant="bodyMd" tone="subdued">
            {t('empty')}
          </Text>
        ) : (
          <>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              <FlowRow
                label={t('sent')}
                count={sent}
                percent={funnel.sent.percent_of_sent}
                sent={sent}
                segments={[{ value: sent, color: CONFIRMED }]}
                showPercent={false}
              />
              <FlowRow
                label={t('delivered')}
                count={funnel.delivered.count}
                percent={funnel.delivered.percent_of_sent}
                sent={sent}
                segments={[{ value: funnel.delivered.count, color: CONFIRMED }]}
                showPercent
              />
              <FlowRow
                label={t('read')}
                count={funnel.read.count}
                percent={funnel.read.percent_of_sent}
                sent={sent}
                segments={[{ value: funnel.read.count, color: CONFIRMED }]}
                showPercent
              />
              <FlowRow
                label={t('replied')}
                count={funnel.replied.count}
                percent={funnel.replied.percent_of_sent}
                sent={sent}
                segments={[
                  { value: funnel.confirmed, color: CONFIRMED },
                  { value: funnel.customer_canceled, color: CANCELED },
                ]}
                showPercent
              />
            </ul>
            <Divider />
            <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
              <LegendItem
                color={CONFIRMED}
                label={t('legendConfirmed', {
                  count: formatCount(funnel.confirmed, locale),
                })}
              />
              <LegendItem
                color={CANCELED}
                label={t('legendCanceled', {
                  count: formatCount(funnel.customer_canceled, locale),
                })}
              />
              <LegendItem
                color={NO_REPLY}
                label={t('legendNoReply', {
                  count: formatCount(funnel.no_reply_yet, locale),
                })}
              />
            </ul>
          </>
        )}
      </BlockStack>
    </Card>
  )
}
