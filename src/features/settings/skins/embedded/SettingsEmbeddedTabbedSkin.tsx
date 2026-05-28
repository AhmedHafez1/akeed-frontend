'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  Icon,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  Select,
  Tabs,
  Text,
  TextField,
} from '@shopify/polaris'
import { InfoIcon, ShieldCheckMarkIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import type {
  ArabicCodTemplateVariantId,
  AutomationTimezone,
  EnglishCodTemplateVariantId,
  IntegrationOnboardingLanguage,
} from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'

type SettingsTabId = 'store' | 'confirmation' | 'message-preview' | 'billing'

const SETTINGS_TABS: SettingsTabId[] = [
  'store',
  'confirmation',
  'message-preview',
  'billing',
]

const SETTINGS_TAB_ALIASES: Partial<Record<string, SettingsTabId>> = {
  settings: 'store',
  'confirmation-config': 'confirmation',
  'message-template': 'message-preview',
}

const SUBSCRIPTION_SECTION_ID = 'subscription-usage'

function HelpIcon({ content }: { content: string }) {
  return (
    <span
      title={content}
      aria-label={content}
      className="inline-flex h-5 w-5 items-center justify-center text-[#8a8a8a]"
    >
      <Icon source={InfoIcon} tone="subdued" />
    </span>
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

function SettingsUsageOverview({
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

function StoreTab({ props }: { props: SettingsSkinProps }) {
  const t = useTranslations('settings')

  return (
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
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
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
        </InlineGrid>
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
  )
}

function BillingTab({ props }: { props: SettingsSkinProps }) {
  const t = useTranslations('settings')
  const canChangePlan =
    props.selectedPlanId !== null &&
    props.selectedPlanId !== props.billingPlanId

  return (
    <div id={SUBSCRIPTION_SECTION_ID}>
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">
              {t('subscriptionHeading')}
            </Text>
            <Text as="p" variant="bodyMd">
              {props.activePlanName
                ? t('subscriptionCurrentPlan', { plan: props.activePlanName })
                : t('subscriptionNoPlan')}
            </Text>
          </BlockStack>

          {props.usageData && (
            <SettingsUsageOverview
              used={props.usageData.used}
              limit={props.usageData.limit}
              title={t('usageTitle')}
              usedLabel={props.usageData.usedLabel}
              limitLabel={props.usageData.limitLabel}
              upgradePrompt={props.usageData.upgradePrompt}
            />
          )}

          <InlineGrid columns={{ xs: 1, md: 2, lg: 4 }} gap="300">
            {props.planOptions.map((plan) => {
              const isCurrent = plan.id === props.billingPlanId
              const isDisabled =
                props.isFreePlanClaimed && plan.id === 'starter'
              const isSelected = plan.id === props.selectedPlanId && !isDisabled

              return (
                <button
                  key={plan.id}
                  type="button"
                  disabled={isDisabled && !isCurrent}
                  title={
                    isDisabled && !isCurrent
                      ? t('freePlanAlreadyClaimedTooltip')
                      : undefined
                  }
                  onClick={() => props.onPlanSelect(plan.id)}
                  className={`min-h-full rounded-xl border text-center transition outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/25 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/35'
                      : 'border-transparent bg-transparent hover:border-slate-200'
                  }`}
                >
                  <Card>
                    <BlockStack gap="300" inlineAlign="center">
                      <Text as="h3" variant="headingSm" tone="subdued">
                        {plan.name}
                      </Text>
                      <span className="min-h-5">
                        {isCurrent && (
                          <Badge tone="info">{t('currentPlanBadge')}</Badge>
                        )}
                      </span>
                      <Text as="p" variant="headingLg">
                        <span dir="auto" className="[unicode-bidi:isolate]">
                          {plan.priceLabel}
                        </span>
                      </Text>
                      <Text as="p" tone="subdued" variant="bodySm">
                        <span dir="auto" className="[unicode-bidi:isolate]">
                          {plan.volumeLabel}
                        </span>
                      </Text>
                    </BlockStack>
                  </Card>
                </button>
              )
            })}
          </InlineGrid>

          {canChangePlan && (
            <InlineStack gap="300">
              <Button
                variant="primary"
                loading={props.isChangingPlan}
                onClick={() => void props.onChangePlan()}
              >
                {t('changePlanButton')}
              </Button>
            </InlineStack>
          )}
        </BlockStack>
      </Card>
    </div>
  )
}

function ConfirmationConfigTab({ props }: { props: SettingsSkinProps }) {
  const t = useTranslations('settings')

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack gap="150" blockAlign="center">
          <Text as="h2" variant="headingMd">
            {t('automation.heading')}
          </Text>
          <HelpIcon content={t('automation.description')} />
        </InlineStack>
        <Divider />
        <Checkbox
          label={
            <InlineStack gap="100" blockAlign="center">
              <Text as="span">{t('autoVerifyLabel')}</Text>
              <HelpIcon content={t('autoVerifyDescription')} />
            </InlineStack>
          }
          checked={props.isAutoVerifyEnabled}
          onChange={props.onAutoVerifyChange}
        />
        <TextField
          label={t('automation.sendDelayMinutesLabel')}
          type="number"
          autoComplete="off"
          min={0}
          max={720}
          step={0.25}
          value={props.sendDelayMinutes}
          onChange={props.onSendDelayMinutesChange}
          error={props.sendDelayMinutesError}
        />
        <Divider />
        <Checkbox
          label={t('automation.followUpEnabledLabel')}
          checked={props.followUpEnabled}
          onChange={props.onFollowUpEnabledChange}
        />
        <TextField
          label={t('automation.followUpDelayMinutesLabel')}
          type="number"
          autoComplete="off"
          min={0}
          max={720}
          step={0.25}
          value={props.followUpDelayMinutes}
          onChange={props.onFollowUpDelayMinutesChange}
          error={props.followUpDelayMinutesError}
          disabled={!props.followUpEnabled}
        />
        <Divider />
        <Checkbox
          label={t('automation.escalationEnabledLabel')}
          checked={props.escalationEnabled}
          onChange={props.onEscalationEnabledChange}
        />
        <TextField
          label={t('automation.escalationDelayMinutesLabel')}
          type="number"
          autoComplete="off"
          min={0}
          max={720}
          step={0.25}
          value={props.escalationDelayMinutes}
          onChange={props.onEscalationDelayMinutesChange}
          error={props.escalationDelayMinutesError}
          disabled={!props.escalationEnabled}
        />
        <Divider />
        <Checkbox
          label={t('automation.quietHoursEnabledLabel')}
          checked={props.quietHoursEnabled}
          onChange={props.onQuietHoursEnabledChange}
        />
        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
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
        </InlineGrid>
      </BlockStack>
    </Card>
  )
}

function renderTemplateBody(
  template: SettingsSkinProps['templatePreviews']['en']
): string[] {
  const applyPreviewReplacements = (value: string) => {
    return [
      ['{{customer}}', 'Sara'],
      ['{{store}}', 'Akeed Store'],
      ['{{order}}', '11996743237999'],
      ['{{total}}', '$600.00'],
    ].reduce((result, [token, replacement]) => {
      return result.split(token).join(replacement)
    }, value)
  }

  return [
    applyPreviewReplacements(template.greeting),
    applyPreviewReplacements(template.body),
    applyPreviewReplacements(template.totalLabel),
    applyPreviewReplacements(template.ending),
  ]
}

function MessageTemplateTab({ props }: { props: SettingsSkinProps }) {
  const t = useTranslations('messagePreview')
  const [language, setLanguage] = useState<'ar' | 'en'>(
    props.defaultTemplateLanguage
  )
  const selectedVariant =
    language === 'ar'
      ? props.selectedCodTemplateVariants.ar
      : props.selectedCodTemplateVariants.en
  const availableVariants = props.codTemplateVariants[language]
  const selectedDefinition = availableVariants.find(
    (variant) => variant.variant === selectedVariant
  )
  const template = selectedDefinition?.preview ?? props.templatePreviews[language]
  const isRtl = language === 'ar'

  const variantOptions = availableVariants.map((variant) => ({
    label: t(`variantLabels.${variant.variant}`),
    value: variant.variant,
  }))

  const handleVariantChange = (value: string) => {
    if (language === 'ar') {
      props.onCodTemplateArVariantChange(value as ArabicCodTemplateVariantId)
      return
    }

    props.onCodTemplateEnVariantChange(value as EnglishCodTemplateVariantId)
  }

  const defaultVariant = props.codTemplateDefaults[language]
  const isDefaultVariant = selectedVariant === defaultVariant

  return (
    <BlockStack gap="400">
      <InlineStack align="end" gap="200">
        {props.templateLanguages.includes('ar') && (
          <Button pressed={language === 'ar'} onClick={() => setLanguage('ar')}>
            {t('languageArabic')}
          </Button>
        )}
        {props.templateLanguages.includes('en') && (
          <Button pressed={language === 'en'} onClick={() => setLanguage('en')}>
            {t('languageEnglish')}
          </Button>
        )}
      </InlineStack>

      <Layout>
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  {t('variantSelectorTitle')}
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  {t('variantSelectorDescription')}
                </Text>
                <Select
                  label={t('variantLabel')}
                  options={variantOptions}
                  value={selectedVariant}
                  onChange={handleVariantChange}
                />
                <InlineStack align="space-between" gap="200">
                  <Text as="span" tone="subdued" variant="bodySm">
                    {t('defaultVariantLabel', {
                      variant: t(`variantLabels.${defaultVariant}`),
                    })}
                  </Text>
                  <Badge tone={isDefaultVariant ? 'success' : 'info'}>
                    {isDefaultVariant ? t('badgeDefault') : t('badgeCustom')}
                  </Badge>
                </InlineStack>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {t('aboutTitle')}
                </Text>
                <Text as="p" variant="bodyMd">
                  {t('aboutDescription')}
                </Text>
                <InlineStack align="space-between" gap="400">
                  <Text as="span" tone="subdued">
                    {t('purposeLabel')}
                  </Text>
                  <Text as="span" fontWeight="medium">
                    {t('purposeValue')}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between" gap="400">
                  <Text as="span" tone="subdued">
                    {t('channelLabel')}
                  </Text>
                  <Badge tone="success">{t('whatsappLabel')}</Badge>
                </InlineStack>
              </BlockStack>
            </Card>
            <Card>
              <InlineStack gap="400" blockAlign="center" wrap={false}>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <Icon source={ShieldCheckMarkIcon} tone="success" />
                </span>
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    {t('trustTitle')}
                  </Text>
                  <Text as="p" tone="subdued" variant="bodySm">
                    {t('trustNote')}
                  </Text>
                </BlockStack>
              </InlineStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Box
              background="bg-surface-secondary"
              borderRadius="300"
              padding="600"
            >
              <InlineStack align="center">
                <div className="relative w-full max-w-66.25 rounded-[2.75rem] border-10 border-[#111213] bg-[#111213] shadow-xl">
                  <div className="absolute top-4 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
                  <div className="overflow-hidden rounded-[2.05rem] bg-[#fbf7ef]">
                    <div className="flex h-12 items-center justify-between px-6 text-xs font-semibold text-[#111213]">
                      <span>9:41</span>
                      <span className="h-2 w-6 rounded-sm border border-[#111213]" />
                    </div>
                    <div className="px-5 pb-8">
                      <div
                        dir={isRtl ? 'rtl' : 'ltr'}
                        className="rounded-lg bg-white p-4 text-sm leading-7 text-[#202223] shadow-sm"
                      >
                        {renderTemplateBody(template).map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                        <div className="mt-4 border-t border-slate-100 pt-3 text-center font-medium text-emerald-700">
                          {template.confirmButton}
                        </div>
                        <div className="mt-3 border-t border-slate-100 pt-3 text-center font-medium text-emerald-700">
                          {template.cancelButton}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </InlineStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </BlockStack>
  )
}

export function SettingsEmbeddedTabbedSkin(props: SettingsSkinProps) {
  const t = useTranslations('settings')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isErrorDismissed, setIsErrorDismissed] = useState(false)
  const [isSuccessDismissed, setIsSuccessDismissed] = useState(false)
  const tabParam = searchParams.get('tab')
  const activeTab: SettingsTabId = SETTINGS_TABS.includes(
    tabParam as SettingsTabId
  )
    ? (tabParam as SettingsTabId)
    : (SETTINGS_TAB_ALIASES[tabParam ?? ''] ?? 'store')
  const selected = SETTINGS_TABS.indexOf(activeTab)
  const canSaveActiveTab =
    activeTab === 'store' ||
    activeTab === 'confirmation' ||
    activeTab === 'message-preview'

  const tabs = [
    { id: 'store', content: t('tabs.store') },
    { id: 'confirmation', content: t('tabs.confirmation') },
    { id: 'message-preview', content: t('tabs.messagePreview') },
    { id: 'billing', content: t('tabs.billing') },
  ]

  const handleTabSelect = (index: number) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('tab', SETTINGS_TABS[index])
    router.push(`${pathname}?${nextParams.toString()}`)
  }

  return (
    <Page title={t('title')} subtitle={t('embeddedSubtitle')}>
      <BlockStack gap="500">
        {props.errorBanner && !isErrorDismissed && (
          <Banner tone="critical" onDismiss={() => setIsErrorDismissed(true)}>
            <p>{props.errorBanner}</p>
          </Banner>
        )}
        {props.successBanner && !isSuccessDismissed && (
          <Banner tone="success" onDismiss={() => setIsSuccessDismissed(true)}>
            <p>{props.successBanner}</p>
          </Banner>
        )}

        <InlineStack align="space-between" blockAlign="center" gap="400">
          <div className="min-w-0 flex-1">
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabSelect} />
          </div>
          {canSaveActiveTab && (
            <Button
              variant="primary"
              loading={props.isSaving}
              onClick={() => void props.onSave()}
            >
              {props.isSaving ? t('savingButton') : t('saveButton')}
            </Button>
          )}
        </InlineStack>

        {activeTab === 'store' && <StoreTab props={props} />}
        {activeTab === 'confirmation' && (
          <ConfirmationConfigTab props={props} />
        )}
        {activeTab === 'message-preview' && (
          <MessageTemplateTab props={props} />
        )}
        {activeTab === 'billing' && <BillingTab props={props} />}
      </BlockStack>
    </Page>
  )
}
