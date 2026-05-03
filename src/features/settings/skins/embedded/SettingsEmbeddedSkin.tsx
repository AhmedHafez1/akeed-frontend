import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Layout,
  Page,
  Select,
  Text,
  TextField,
  Tooltip,
} from '@shopify/polaris'
import { QuestionCircleIcon, ShieldCheckMarkIcon } from '@shopify/polaris-icons'
import Image from 'next/image'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type {
  IntegrationOnboardingLanguage,
  OnboardingBillingPlanId,
} from '@/features/onboarding'
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
              className={`min-h-full rounded-xl border text-start transition outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/25 disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/35'
                  : 'border-transparent bg-transparent hover:border-slate-200'
              }`}
            >
              <Card>
                <BlockStack gap="300">
                  <div className="flex items-center justify-between gap-2">
                    <Text as="h3" variant="headingSm" tone="subdued">
                      {plan.name}
                    </Text>
                    {isCurrent && (
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
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
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            usagePercent >= 80
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {usedLabel}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            usagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
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

function HelpIcon({ content }: { content: string }) {
  return (
    <Tooltip content={content} preferredPosition="above">
      <span className="inline-flex h-5 w-5 items-center justify-center text-[#8a8a8a]">
        <Icon source={QuestionCircleIcon} tone="subdued" />
      </span>
    </Tooltip>
  )
}

function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <InlineStack gap="100" blockAlign="center">
      <Text as="span" variant="bodyMd">
        {label}
      </Text>
      {help ? <HelpIcon content={help} /> : null}
    </InlineStack>
  )
}

function EmbeddedLanguagePreview() {
  const t = useTranslations('messagePreview')
  const [language, setLanguage] = useState<IntegrationOnboardingLanguage>('ar')
  const previewSrc =
    language === 'ar'
      ? '/images/Preview/ar-preview-light.png'
      : '/images/Preview/en-preview-light.png'

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center" gap="300">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              {t('title')}
            </Text>
            <InlineStack gap="150" blockAlign="center">
              <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                {t('whatsappLabel')}
              </span>
              <Text as="span" tone="subdued" variant="bodySm">
                {t('sampleBadge')}
              </Text>
            </InlineStack>
          </BlockStack>

          <InlineStack gap="200">
            <Button
              size="slim"
              pressed={language === 'ar'}
              onClick={() => setLanguage('ar')}
            >
              {t('languageArabic')}
            </Button>
            <Button
              size="slim"
              pressed={language === 'en'}
              onClick={() => setLanguage('en')}
            >
              {t('languageEnglish')}
            </Button>
          </InlineStack>
        </InlineStack>

        <Box
          background="bg-surface-secondary"
          borderColor="border"
          borderRadius="300"
          borderWidth="025"
          padding="300"
        >
          <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white shadow-sm">
            <Image
              src={previewSrc}
              alt={t('title')}
              width={1200}
              height={750}
              className="h-auto w-full"
              priority={false}
            />
          </div>
        </Box>

        <InlineStack gap="200" blockAlign="center">
          <Icon source={ShieldCheckMarkIcon} tone="success" />
          <Text as="p" tone="subdued" variant="bodySm">
            {t('trustNote')}
          </Text>
        </InlineStack>
      </BlockStack>
    </Card>
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

                <BlockStack gap="100">
                  <FieldLabel
                    label={t('avgShippingCostLabel')}
                    help={t('avgShippingCostHelp')}
                  />
                  <TextField
                    label={t('avgShippingCostLabel')}
                    labelHidden
                    type="number"
                    autoComplete="off"
                    min={0}
                    step={0.01}
                    value={props.avgShippingCost}
                    onChange={props.onAvgShippingCostChange}
                    error={props.avgShippingCostError}
                  />
                </BlockStack>
              </BlockStack>
            </Card>

            <EmbeddedLanguagePreview />

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
