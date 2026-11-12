'use client'

import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  ProgressBar,
  Text,
} from '@shopify/polaris'
import { InfoIcon, RefreshIcon } from '@shopify/polaris-icons'
import { useLocale, useTranslations } from 'next-intl'
import {
  PLAN_NAME_KEYS,
  PlanAllowanceSummary,
  SharedFeaturesList,
  UsageRulesCard,
  formatMessageCount,
  ownNumberAllowance,
  type OwnNumberAllowance,
} from '@/features/billing'
import type {
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from '@/features/onboarding'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import { getFormatLocale } from '@/shared/lib/locale'
import {
  recommendPlan,
  resolvePrimaryPlanId,
  resolveUsageBanner,
  usagePercent,
} from '@/features/settings/domain/planUsage'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import type { UsagePools } from '@/shared/types/usagePools'

interface PlanTabProps {
  model: EmbeddedSettingsModel
  data: SettingsResponse
  /** The merchant's own number is offered or connected. */
  ownNumberVisible?: boolean
  /** The merchant's own number is connected and active. */
  ownNumberConnected?: boolean
}

export function PlanTab({
  model,
  data,
  ownNumberVisible = false,
  ownNumberConnected = false,
}: PlanTabProps) {
  const t = useTranslations('settings.embedded.plan')
  const tPlans = useTranslations('billing.embeddedPlans')
  const tNames = useTranslations('embeddedOnboarding')
  const locale = useLocale()

  const { state, billing } = data
  // Each pool as charged, once the merchant's own number is offered or has
  // paid for sends; otherwise the single allowance as before.
  const pools =
    billing.usage.pools &&
    (ownNumberVisible || billing.usage.pools.ownNumber.used > 0)
      ? billing.usage.pools
      : null
  const planName = (id: OnboardingBillingPlanId) => tNames(PLAN_NAME_KEYS[id])
  const currentPlanId = state.billingPlanId
  const currentPlan = billing.plans.find((plan) => plan.id === currentPlanId)
  const isFree = !currentPlan || currentPlan.amount === 0
  const { used, limit, periodEnd } = billing.usage
  const percent = usagePercent(used, limit)
  const banner = resolveUsageBanner(used, limit)
  const remaining = Math.max(0, limit - used)
  const paidThroughAt = billing.paidThroughAt ?? null
  const paidThroughDate = paidThroughAt
    ? new Intl.DateTimeFormat(`${getFormatLocale(locale)}-u-nu-latn`, {
        dateStyle: 'long',
      }).format(new Date(paidThroughAt))
    : null
  // `periodEnd` is a calendar date, so it is read in UTC, not the browser zone.
  // A paid-through period ends at its date instead of renewing.
  const renewalDate =
    periodEnd && !paidThroughDate
      ? new Intl.DateTimeFormat(`${getFormatLocale(locale)}-u-nu-latn`, {
          dateStyle: 'long',
          timeZone: 'UTC',
        }).format(new Date(periodEnd))
      : null
  // Shopify-billed stores see the plans; only owners and admins can subscribe.
  const isShopifyBilled =
    state.billingManagement?.mode === 'shopify' &&
    state.billingManagement.canManageBilling === true
  const canSubscribe = state.permissions.canUpdateConfiguration
  const sentLast30Days = billing.messagesSentLast30Days ?? 0
  const paidPlans = billing.plans.filter((plan) => plan.amount > 0)
  const ownNumberPresence = {
    visible: ownNumberVisible,
    connected: ownNumberConnected,
  }
  const showsOwnNumber = paidPlans.some((plan) =>
    Boolean(ownNumberAllowance(plan, ownNumberPresence))
  )
  const usagePools = billing.usage.pools
  const byPool =
    billing.messagesSentLast30DaysByPool &&
    usagePools &&
    usagePools.akeed.limit > 0
      ? {
          ...billing.messagesSentLast30DaysByPool,
          ownNumberRatio: usagePools.ownNumber.limit / usagePools.akeed.limit,
        }
      : null
  const recommendedId = recommendPlan(billing.plans, sentLast30Days, byPool)
  // Only a live paid plan renews; Starter and a lapsed plan do not, nor a
  // paid-through period (no subscription yet: choosing its plan subscribes).
  const renewablePlanId = paidThroughDate
    ? null
    : (billing.currentPlanId ?? null)
  const primaryId = resolvePrimaryPlanId(
    billing.plans,
    currentPlanId ?? null,
    recommendedId
  )

  return (
    <BlockStack gap="400">
      {paidThroughDate && (
        <Banner tone="info">
          <p>{tPlans('paidThroughNote', { date: paidThroughDate })}</p>
        </Banner>
      )}
      {banner && (
        <Banner
          tone={banner.tone}
          title={
            banner.tone === 'critical'
              ? t('criticalTitle')
              : t(isFree ? 'warningTitleFree' : 'warningTitle', {
                  remaining: banner.remaining,
                })
          }
        >
          <p>
            {banner.tone === 'critical'
              ? t('criticalBody')
              : renewalDate
                ? t('warningBodyRenews', { date: renewalDate })
                : t('warningBody')}
          </p>
        </Banner>
      )}

      <Card>
        <BlockStack gap="300">
          <InlineStack gap="200" blockAlign="center">
            <Text as="h2" variant="headingMd">
              {currentPlanId
                ? t('currentPlan', { plan: planName(currentPlanId) })
                : t('noPlan')}
            </Text>
            {currentPlanId && (
              <Badge>{isFree ? t('badgeFree') : t('badgeMonthly')}</Badge>
            )}
          </InlineStack>
          {pools ? (
            <PoolMeters pools={pools} renewalDate={renewalDate} />
          ) : (
            <>
              <InlineStack
                align="space-between"
                blockAlign="baseline"
                gap="300"
              >
                <div id="settings-usage-label">
                  <InlineStack gap="200" blockAlign="baseline">
                    <Text as="span" variant="heading2xl">
                      <bdi>{formatMessageCount(used)}</bdi>
                    </Text>
                    <Text as="span" tone="subdued">
                      {tPlans('usedOf', { limit: formatMessageCount(limit) })}
                    </Text>
                  </InlineStack>
                </div>
                <Text as="p" fontWeight="semibold">
                  {tPlans('remaining', {
                    count: remaining,
                    formatted: formatMessageCount(remaining),
                  })}
                </Text>
              </InlineStack>
              <ProgressBar
                progress={percent}
                tone={percent >= 100 ? 'critical' : 'primary'}
                size="small"
                ariaLabelledBy="settings-usage-label"
                animated={false}
              />
            </>
          )}
          {/* The pools say when they renew themselves. */}
          {!pools && !paidThroughDate && (
            <div className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center">
                <Icon
                  source={renewalDate ? RefreshIcon : InfoIcon}
                  tone="subdued"
                />
              </span>
              <Text as="p" tone="subdued">
                {renewalDate
                  ? tPlans('renews', {
                      limit: formatMessageCount(limit),
                      date: renewalDate,
                    })
                  : tPlans('oneTime')}
              </Text>
            </div>
          )}
        </BlockStack>
      </Card>

      {model.planError && (
        <Banner tone="critical" onDismiss={model.dismissPlanError}>
          <p>{model.planError}</p>
        </Banner>
      )}

      {isShopifyBilled ? (
        <>
          <BlockStack gap="100">
            <Text as="h2" variant="headingLg">
              {tPlans('heading')}
            </Text>
            <Text as="p" tone="subdued">
              {tPlans('sameFeatures')}
            </Text>
          </BlockStack>
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            {paidPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                name={planName(plan.id)}
                // During a paid-through period the plan can be subscribed to,
                // so its card offers that rather than a disabled "current".
                isCurrent={plan.id === currentPlanId && !paidThroughDate}
                canRenew={plan.id === renewablePlanId}
                isRecommended={plan.id === recommendedId}
                isPrimary={plan.id === primaryId}
                ownNumber={ownNumberAllowance(plan, ownNumberPresence)}
                sentLast30Days={sentLast30Days}
                isSubscribing={model.subscribingPlanId === plan.id}
                isBusy={!canSubscribe || model.subscribingPlanId !== null}
                onSubscribe={() => void model.subscribe(plan.id)}
                onRenew={() => void model.subscribe(plan.id, { renew: true })}
              />
            ))}
          </InlineGrid>
          <Card>
            <SharedFeaturesList />
          </Card>
          <UsageRulesCard />
          <Text as="p" tone="subdued">
            {tPlans('footer')}
            {showsOwnNumber && ` ${tPlans('ownNumber.note')}`}
          </Text>
        </>
      ) : (
        <Banner tone="info">
          <p>{t('billingManaged')}</p>
        </Banner>
      )}
    </BlockStack>
  )
}

/** The Akeed and own-number pools, side by side, for one billing period. */
function PoolMeters({
  pools,
  renewalDate,
}: {
  pools: UsagePools
  renewalDate: string | null
}) {
  const t = useTranslations('settings.embedded.plan.pools')
  const tPlans = useTranslations('billing.embeddedPlans')
  const rows = [
    { key: 'akeed', pool: pools.akeed },
    { key: 'ownNumber', pool: pools.ownNumber },
  ] as const
  return (
    <BlockStack gap="300">
      <Text as="p" fontWeight="semibold">
        {t('title')}
      </Text>
      <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
        {rows.map(({ key, pool }) => {
          const labelId = `settings-pool-${key}`
          return (
            <BlockStack key={key} gap="200">
              <Text as="p" tone="subdued" id={labelId}>
                {t(key)}
              </Text>
              <InlineStack gap="200" blockAlign="baseline">
                <Text as="span" variant="headingXl">
                  <bdi>{formatMessageCount(pool.used)}</bdi>
                </Text>
                <Text as="span" tone="subdued">
                  {tPlans('usedOf', { limit: formatMessageCount(pool.limit) })}
                </Text>
              </InlineStack>
              <ProgressBar
                progress={usagePercent(pool.used, pool.limit)}
                tone={pool.used >= pool.limit ? 'critical' : 'primary'}
                size="small"
                ariaLabelledBy={labelId}
                animated={false}
              />
              <Text as="p" tone="subdued">
                {tPlans('remaining', {
                  count: pool.remaining,
                  formatted: formatMessageCount(pool.remaining),
                })}
              </Text>
            </BlockStack>
          )
        })}
      </InlineGrid>
      <Text as="p" tone="subdued">
        {renewalDate ? t('noteRenews', { date: renewalDate }) : t('note')}
      </Text>
    </BlockStack>
  )
}

interface PlanCardProps {
  plan: OnboardingBillingPlanConfig
  name: string
  isCurrent: boolean
  /** The current plan is live and paid, so it can be bought again now. */
  canRenew: boolean
  isRecommended: boolean
  isPrimary: boolean
  ownNumber: OwnNumberAllowance | null
  sentLast30Days: number
  isSubscribing: boolean
  isBusy: boolean
  onSubscribe: () => void
  onRenew: () => void
}

function PlanCard({
  plan,
  name,
  isCurrent,
  canRenew,
  isRecommended,
  isPrimary,
  ownNumber,
  sentLast30Days,
  isSubscribing,
  isBusy,
  onSubscribe,
  onRenew,
}: PlanCardProps) {
  const t = useTranslations('settings.embedded.plan')
  const tPlans = useTranslations('billing.embeddedPlans')

  return (
    <div
      className="flex h-full flex-col gap-4"
      style={{
        background: 'var(--p-color-bg-surface)',
        borderRadius: 'var(--p-border-radius-300)',
        padding: 'var(--p-space-400)',
        boxShadow: isRecommended
          ? 'inset 0 0 0 var(--p-border-width-050) var(--p-color-border-emphasis)'
          : 'inset 0 0 0 var(--p-border-width-025) var(--p-color-border)',
      }}
    >
      <PlanAllowanceSummary
        name={name}
        amount={plan.amount}
        currencyCode={plan.currencyCode}
        includedVerifications={plan.includedVerifications}
        ownNumber={ownNumber}
        trailing={
          isRecommended && <Badge tone="info">{tPlans('fitsUsage')}</Badge>
        }
      />
      {isRecommended && (
        <Text as="p" tone="subdued">
          {tPlans('fitsUsageReason', {
            count: formatMessageCount(sentLast30Days),
          })}
        </Text>
      )}
      <div className="mt-auto">
        {isCurrent && canRenew ? (
          <BlockStack gap="200">
            <Button
              fullWidth
              loading={isSubscribing}
              disabled={isBusy && !isSubscribing}
              onClick={onRenew}
            >
              {t('renew', { plan: name })}
            </Button>
            <Text as="p" variant="bodySm" tone="subdued">
              {tPlans('renewNote')}
            </Text>
          </BlockStack>
        ) : isCurrent ? (
          <Button fullWidth disabled>
            {t('currentPlanButton')}
          </Button>
        ) : (
          <Button
            fullWidth
            variant={isPrimary ? 'primary' : 'secondary'}
            loading={isSubscribing}
            disabled={isBusy && !isSubscribing}
            onClick={onSubscribe}
          >
            {t('subscribe', { plan: name })}
          </Button>
        )}
      </div>
    </div>
  )
}
