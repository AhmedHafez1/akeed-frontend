import {
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  Layout,
  Page,
  Select,
  Text,
  TextField,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import { VerificationTemplatePreview } from '@/features/message-preview'
import type {
  IntegrationOnboardingLanguage,
  OnboardingBillingPlanId,
} from '@/features/onboarding'
import type { AutomationTimezone } from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'

const SUBSCRIPTION_SECTION_ID = 'subscription-usage'

interface EmbeddedPlanComparisonProps {
  plans: SettingsSkinProps['planOptions']
  currentPlanId: OnboardingBillingPlanId | null
  selectedPlanId: OnboardingBillingPlanId | null
  isChangingPlan: boolean
  disabledPlanIds?: OnboardingBillingPlanId[]
  disabledPlanTooltips?: Partial<Record<OnboardingBillingPlanId, string>>
  currentBadgeLabel: string
  changePlanLabel: string
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
  onChangePlan: () => Promise<void>
}

function EmbeddedPlanComparison({
  plans,
  currentPlanId,
  selectedPlanId,
  isChangingPlan,
  disabledPlanIds = [],
  disabledPlanTooltips = {},
  currentBadgeLabel,
  changePlanLabel,
  onPlanSelect,
  onChangePlan,
}: EmbeddedPlanComparisonProps) {
  const hasSelection =
    selectedPlanId !== null && selectedPlanId !== currentPlanId

  return (
    <BlockStack gap="400">
      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const isDisabled = disabledPlanIds.includes(plan.id) && !isCurrent
          const isSelected = plan.id === selectedPlanId && !isDisabled

          return (
            <button
              key={plan.id}
              type="button"
              disabled={isDisabled}
              title={isDisabled ? disabledPlanTooltips[plan.id] : undefined}
              onClick={() => onPlanSelect(plan.id)}
              className={`min-h-full rounded-xl text-start outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/35 disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected ? 'shadow-[0_0_0_3px_rgba(0,160,70,0.7)]' : ''
              }`}
            >
              <Card>
                <BlockStack gap="300">
                  <div className="flex items-center justify-between gap-2">
                    <Text as="h3" variant="headingSm" tone="subdued">
                      {plan.name}
                    </Text>
                    {isCurrent && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {currentBadgeLabel}
                      </span>
                    )}
                  </div>

                  <Text as="p" variant="headingLg">
                    <span
                      dir="auto"
                      className="block text-center [unicode-bidi:isolate]"
                    >
                      {plan.priceLabel}
                    </span>
                  </Text>

                  <Text as="p" tone="subdued" variant="bodySm">
                    {plan.volumeLabel}
                  </Text>
                </BlockStack>
              </Card>
            </button>
          )
        })}
      </div>

      {hasSelection && (
        <div>
          <Button
            variant="primary"
            loading={isChangingPlan}
            onClick={() => void onChangePlan()}
          >
            {changePlanLabel}
          </Button>
        </div>
      )}
    </BlockStack>
  )
}

function EmbeddedUsageOverview({
  used,
  limit,
  title,
  usedLabel,
  limitLabel,
  upgradePrompt,
}: {
  used: number
  limit: number
  title: string
  usedLabel: string
  limitLabel: string
  upgradePrompt: string | null
}) {
  const safeLimit = Math.max(limit, 1)
  const usagePercent = Math.min(100, Math.round((used / safeLimit) * 100))

  return (
    <BlockStack gap="300">
      <div className="flex items-center justify-between gap-3">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            usagePercent >= 80
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {usedLabel}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            usagePercent >= 80 ? 'bg-red-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {used} / {limit}
        </span>
        <span>{limitLabel}</span>
      </div>
      {upgradePrompt && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          {upgradePrompt}
        </div>
      )}
    </BlockStack>
  )
}

export function SettingsEmbeddedSkin(props: SettingsSkinProps) {
  const t = useTranslations('settings')

  return (
    <Page title={t('title')} subtitle={t('subtitle')}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {props.errorBanner && (
              <Banner tone="critical">
                <p>{props.errorBanner}</p>
              </Banner>
            )}

            {props.successBanner && (
              <Banner tone="success">
                <p>{props.successBanner}</p>
              </Banner>
            )}

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {t('storeConfigurationHeading')}
                </Text>

                <TextField
                  label={t('storeNameLabel')}
                  value={props.storeName}
                  onChange={props.onStoreNameChange}
                  autoComplete="organization"
                  error={props.storeNameError}
                />

                <Select
                  label={t('defaultLanguageLabel')}
                  options={[...props.languageOptions]}
                  value={props.defaultLanguage}
                  onChange={(value) =>
                    props.onDefaultLanguageChange(
                      value as IntegrationOnboardingLanguage
                    )
                  }
                />

                <Select
                  label={t('shippingCurrencyLabel')}
                  options={[...props.shippingCurrencyOptions]}
                  value={props.shippingCurrency}
                  onChange={props.onShippingCurrencyChange}
                />

                <TextField
                  label={t('avgShippingCostLabel')}
                  type="number"
                  autoComplete="off"
                  min={0}
                  step={0.01}
                  value={props.avgShippingCost}
                  onChange={props.onAvgShippingCostChange}
                  error={props.avgShippingCostError}
                  helpText={t('avgShippingCostHelp')}
                />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <BlockStack gap="150">
                  <Text as="h2" variant="headingMd">
                    {t('automation.heading')}
                  </Text>
                  <Text as="p" tone="subdued" variant="bodySm">
                    {t('automation.description')}
                  </Text>
                </BlockStack>

                <Checkbox
                  label={t('autoVerifyLabel')}
                  helpText={t('autoVerifyDescription')}
                  checked={props.isAutoVerifyEnabled}
                  onChange={props.onAutoVerifyChange}
                />

                <TextField
                  label={t('automation.sendDelayMinutesLabel')}
                  type="number"
                  autoComplete="off"
                  min={0}
                  max={1440}
                  step={1}
                  value={props.sendDelayMinutes}
                  onChange={props.onSendDelayMinutesChange}
                  error={props.sendDelayMinutesError}
                  helpText={t('automation.sendDelayMinutesHelp')}
                />

                <Divider />

                <Checkbox
                  label={t('automation.followUpEnabledLabel')}
                  helpText={t('automation.followUpEnabledHelp')}
                  checked={props.followUpEnabled}
                  onChange={props.onFollowUpEnabledChange}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    label={t('automation.followUpDelayMinutesLabel')}
                    type="number"
                    autoComplete="off"
                    min={0}
                    max={10080}
                    step={1}
                    value={props.followUpDelayMinutes}
                    onChange={props.onFollowUpDelayMinutesChange}
                    error={props.followUpDelayMinutesError}
                    disabled={!props.followUpEnabled}
                  />
                  <TextField
                    label={t('automation.escalationDelayMinutesLabel')}
                    type="number"
                    autoComplete="off"
                    min={0}
                    max={10080}
                    step={1}
                    value={props.escalationDelayMinutes}
                    onChange={props.onEscalationDelayMinutesChange}
                    error={props.escalationDelayMinutesError}
                    helpText={t('automation.escalationDelayMinutesHelp')}
                  />
                </div>

                <Divider />

                <Checkbox
                  label={t('automation.quietHoursEnabledLabel')}
                  helpText={t('automation.quietHoursEnabledHelp')}
                  checked={props.quietHoursEnabled}
                  onChange={props.onQuietHoursEnabledChange}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <TextField
                    label={t('automation.quietHoursStartLabel')}
                    type="time"
                    autoComplete="off"
                    value={props.quietHoursStart}
                    onChange={props.onQuietHoursStartChange}
                    disabled={!props.quietHoursEnabled}
                    error={props.quietHoursError}
                  />
                  <TextField
                    label={t('automation.quietHoursEndLabel')}
                    type="time"
                    autoComplete="off"
                    value={props.quietHoursEnd}
                    onChange={props.onQuietHoursEndChange}
                    disabled={!props.quietHoursEnabled}
                  />
                  <Select
                    label={t('automation.timezoneLabel')}
                    options={[...props.timezoneOptions]}
                    value={props.timezone}
                    onChange={(value) =>
                      props.onTimezoneChange(value as AutomationTimezone)
                    }
                  />
                </div>

                <Button
                  variant="primary"
                  loading={props.isSaving}
                  onClick={() => void props.onSave()}
                >
                  {t('saveButton')}
                </Button>
              </BlockStack>
            </Card>

            <Card>
              <VerificationTemplatePreview variant="full" />
            </Card>

            <div id={SUBSCRIPTION_SECTION_ID}>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      {t('subscriptionHeading')}
                    </Text>

                    <Text as="p" variant="bodyMd">
                      {props.activePlanName
                        ? t('subscriptionCurrentPlan', {
                            plan: props.activePlanName,
                          })
                        : t('subscriptionNoPlan')}
                    </Text>

                    <Text as="p" tone="subdued" variant="bodySm">
                      {t('subscriptionStatusLabel', {
                        status: props.billingStatusLabel,
                      })}
                    </Text>
                  </BlockStack>

                  {props.usageData && (
                    <EmbeddedUsageOverview
                      used={props.usageData.used}
                      limit={props.usageData.limit}
                      title={t('usageTitle')}
                      usedLabel={props.usageData.usedLabel}
                      limitLabel={props.usageData.limitLabel}
                      upgradePrompt={props.usageData.upgradePrompt}
                    />
                  )}

                  <EmbeddedPlanComparison
                    plans={props.planOptions}
                    currentPlanId={props.billingPlanId}
                    selectedPlanId={props.selectedPlanId}
                    isChangingPlan={props.isChangingPlan}
                    disabledPlanIds={props.isFreePlanClaimed ? ['starter'] : []}
                    disabledPlanTooltips={
                      props.isFreePlanClaimed
                        ? { starter: t('freePlanAlreadyClaimedTooltip') }
                        : undefined
                    }
                    currentBadgeLabel={t('currentPlanBadge')}
                    changePlanLabel={t('changePlanButton')}
                    onPlanSelect={props.onPlanSelect}
                    onChangePlan={props.onChangePlan}
                  />

                  <Button onClick={props.onManageBilling}>
                    {t('manageBillingButton')}
                  </Button>
                </BlockStack>
              </Card>
            </div>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
