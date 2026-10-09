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
} from '@/features/billing'
import type {
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from '@/features/onboarding'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import {
  recommendPlan,
  resolvePrimaryPlanId,
  resolveUsageBanner,
  usagePercent,
} from '@/features/settings/domain/planUsage'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'

interface PlanTabProps {
  model: EmbeddedSettingsModel
  data: SettingsResponse
}

export function PlanTab({ model, data }: PlanTabProps) {
  const t = useTranslations('settings.embedded.plan')
  const tPlans = useTranslations('billing.embeddedPlans')
  const tNames = useTranslations('embeddedOnboarding')
  const locale = useLocale()

  const { state, billing } = data
  const planName = (id: OnboardingBillingPlanId) => tNames(PLAN_NAME_KEYS[id])
  const currentPlanId = state.billingPlanId
  const currentPlan = billing.plans.find((plan) => plan.id === currentPlanId)
  const isFree = !currentPlan || currentPlan.amount === 0
  const { used, limit, periodEnd } = billing.usage
  const percent = usagePercent(used, limit)
  const banner = resolveUsageBanner(used, limit)
  const remaining = Math.max(0, limit - used)
  // `periodEnd` is a calendar date, so it is read in UTC, not the browser zone.
  const renewalDate = periodEnd
    ? new Intl.DateTimeFormat(`${locale}-u-nu-latn`, {
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
  const recommendedId = recommendPlan(billing.plans, sentLast30Days)
  const primaryId = resolvePrimaryPlanId(
    billing.plans,
    currentPlanId ?? null,
    recommendedId
  )

  return (
    <BlockStack gap="400">
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
          <InlineStack align="space-between" blockAlign="baseline" gap="300">
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
                isCurrent={plan.id === currentPlanId}
                isRecommended={plan.id === recommendedId}
                isPrimary={plan.id === primaryId}
                sentLast30Days={sentLast30Days}
                isSubscribing={model.subscribingPlanId === plan.id}
                isBusy={!canSubscribe || model.subscribingPlanId !== null}
                onSubscribe={() => void model.subscribe(plan.id)}
              />
            ))}
          </InlineGrid>
          <Card>
            <SharedFeaturesList />
          </Card>
          <UsageRulesCard />
          <Text as="p" tone="subdued">
            {tPlans('footer')}
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

interface PlanCardProps {
  plan: OnboardingBillingPlanConfig
  name: string
  isCurrent: boolean
  isRecommended: boolean
  isPrimary: boolean
  sentLast30Days: number
  isSubscribing: boolean
  isBusy: boolean
  onSubscribe: () => void
}

function PlanCard({
  plan,
  name,
  isCurrent,
  isRecommended,
  isPrimary,
  sentLast30Days,
  isSubscribing,
  isBusy,
  onSubscribe,
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
        {isCurrent ? (
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
