'use client'

import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  List,
  ProgressBar,
  Text,
} from '@shopify/polaris'
import { useLocale, useTranslations } from 'next-intl'
import type {
  OnboardingBillingPlanConfig,
  OnboardingBillingPlanId,
} from '@/features/onboarding'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import {
  recommendPlan,
  resolveUsageBanner,
  usagePercent,
} from '@/features/settings/domain/planUsage'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import { formatPlanPrice } from '@/shared/lib/money'

const PLAN_NAME_KEYS: Record<OnboardingBillingPlanId, string> = {
  starter: 'planStarterName',
  basic: 'planBasicName',
  pro: 'planProName',
  business: 'planBusinessName',
}

interface PlanTabProps {
  model: EmbeddedSettingsModel
  data: SettingsResponse
}

export function PlanTab({ model, data }: PlanTabProps) {
  const t = useTranslations('settings.embedded.plan')
  const tPlans = useTranslations('embeddedOnboarding')
  const locale = useLocale()
  const numberLocale = `${locale}-u-nu-latn`
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(numberLocale).format(value)

  const { state, billing } = data
  const planName = (id: OnboardingBillingPlanId) => tPlans(PLAN_NAME_KEYS[id])
  const currentPlanId = state.billingPlanId
  const currentPlan = billing.plans.find((plan) => plan.id === currentPlanId)
  const isFree = !currentPlan || currentPlan.amount === 0
  const { used, limit, periodEnd } = billing.usage
  const percent = usagePercent(used, limit)
  const banner = resolveUsageBanner(used, limit)
  // Shopify-billed stores see the plans; only owners and admins can subscribe.
  const isShopifyBilled =
    state.billingManagement?.mode === 'shopify' &&
    state.billingManagement.canManageBilling === true
  const canSubscribe = state.permissions.canUpdateConfiguration
  const sentLast30Days = billing.messagesSentLast30Days ?? 0
  const paidPlans = billing.plans.filter((plan) => plan.amount > 0)
  const recommendedId = recommendPlan(billing.plans, sentLast30Days)

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
            {banner.tone === 'critical' ? t('criticalBody') : t('warningBody')}
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
          <InlineStack align="space-between" gap="200">
            <Text as="p" id="settings-usage-label">
              {t('used', {
                used: formatNumber(used),
                limit: formatNumber(limit),
              })}
            </Text>
            <Text as="p" tone="subdued">
              {periodEnd
                ? t('renews', {
                    date: new Intl.DateTimeFormat(numberLocale, {
                      dateStyle: 'long',
                    }).format(new Date(periodEnd)),
                  })
                : t('oneTime')}
            </Text>
          </InlineStack>
          <ProgressBar
            progress={percent}
            tone={percent >= 100 ? 'critical' : 'primary'}
            size="small"
            ariaLabelledBy="settings-usage-label"
            animated={false}
          />
        </BlockStack>
      </Card>

      {model.planError && (
        <Banner tone="critical" onDismiss={model.dismissPlanError}>
          <p>{model.planError}</p>
        </Banner>
      )}

      {isShopifyBilled ? (
        <InlineGrid columns={{ xs: 1, md: paidPlans.length || 1 }} gap="400">
          {paidPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              name={planName(plan.id)}
              features={t.raw(`features.${plan.id}`) as string[]}
              isCurrent={plan.id === currentPlanId}
              isRecommended={plan.id === recommendedId}
              recommendationReason={
                plan.id === recommendedId && sentLast30Days > 0
                  ? t('recommendationReason', {
                      count: formatNumber(sentLast30Days),
                    })
                  : null
              }
              allowanceLabel={t('allowance', {
                count: formatNumber(plan.includedVerifications),
              })}
              isSubscribing={model.subscribingPlanId === plan.id}
              isBusy={!canSubscribe || model.subscribingPlanId !== null}
              onSubscribe={() => void model.subscribe(plan.id)}
            />
          ))}
        </InlineGrid>
      ) : (
        <Banner tone="info">
          <p>{t('billingManaged')}</p>
        </Banner>
      )}

      <Text as="p" tone="subdued">
        {t('footer')}
      </Text>
    </BlockStack>
  )
}

interface PlanCardProps {
  plan: OnboardingBillingPlanConfig
  name: string
  features: string[]
  isCurrent: boolean
  isRecommended: boolean
  recommendationReason: string | null
  allowanceLabel: string
  isSubscribing: boolean
  isBusy: boolean
  onSubscribe: () => void
}

function PlanCard({
  plan,
  name,
  features,
  isCurrent,
  isRecommended,
  recommendationReason,
  allowanceLabel,
  isSubscribing,
  isBusy,
  onSubscribe,
}: PlanCardProps) {
  const t = useTranslations('settings.embedded.plan')

  return (
    <Box
      borderColor={isRecommended ? 'border-emphasis' : 'border'}
      borderWidth={isRecommended ? '050' : '025'}
      borderRadius="300"
      background="bg-surface"
      minHeight="100%"
    >
      <Box padding="400" minHeight="100%">
        <BlockStack gap="400" align="space-between">
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" gap="200">
              <Text as="h3" variant="headingMd">
                {name}
              </Text>
              {isRecommended && <Badge tone="info">{t('recommended')}</Badge>}
            </InlineStack>
            <InlineStack gap="100" blockAlign="baseline">
              <Text as="p" variant="heading2xl">
                <bdi dir="ltr">
                  {formatPlanPrice(plan.amount, plan.currencyCode)}
                </bdi>
              </Text>
              <Text as="span" tone="subdued">
                {t('perMonth')}
              </Text>
            </InlineStack>
            <Text as="p" fontWeight="semibold">
              {allowanceLabel}
            </Text>
            {recommendationReason && (
              <Text as="p" tone="subdued">
                {recommendationReason}
              </Text>
            )}
            <List type="bullet">
              {features.map((feature) => (
                <List.Item key={feature}>{feature}</List.Item>
              ))}
            </List>
          </BlockStack>
          {isCurrent ? (
            <Button fullWidth disabled>
              {t('currentPlanButton')}
            </Button>
          ) : (
            <Button
              fullWidth
              variant={isRecommended ? 'primary' : 'secondary'}
              loading={isSubscribing}
              disabled={isBusy && !isSubscribing}
              onClick={onSubscribe}
            >
              {t('subscribe', { plan: name })}
            </Button>
          )}
        </BlockStack>
      </Box>
    </Box>
  )
}
