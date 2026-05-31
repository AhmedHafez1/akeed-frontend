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
import { InfoIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import type {
  ArabicCodTemplateVariantId,
  AutomationTimezone,
  EnglishCodTemplateVariantId,
  IntegrationOnboardingLanguage,
} from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'
import {
  SETTINGS_TABS,
  resolveSettingsTab,
} from '@/features/settings/domain/settingsTabs'
import {
  formatTemplatePreviewTimestamp,
  getTemplatePreviewParagraphs,
} from '@/features/settings/skins/shared/templatePreview'
import { ContextualDocsLink } from '@/shared/ui'

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
          <ContextualDocsLink article="automationRules" />
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

function MessageTemplateTab({ props }: { props: SettingsSkinProps }) {
  const t = useTranslations('messageTemplate')
  const initialLanguage =
    props.defaultLanguage === 'ar' || props.defaultLanguage === 'en'
      ? props.defaultLanguage
      : props.defaultTemplateLanguage
  const [language, setLanguage] = useState<'ar' | 'en'>(initialLanguage)
  const selectedVariant =
    language === 'ar'
      ? props.selectedCodTemplateVariants.ar
      : props.selectedCodTemplateVariants.en
  const availableVariants = props.codTemplateVariants[language]
  const selectedDefinition = availableVariants.find(
    (variant) => variant.variant === selectedVariant
  )
  const template =
    selectedDefinition?.preview ?? props.templatePreviews[language]
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
  const previewParagraphs = getTemplatePreviewParagraphs(template, props.storeName)
  const isStoreLanguageAuto = props.defaultLanguage === 'auto'
  const storeLanguageLabel =
    props.defaultLanguage === 'ar'
      ? t('languageArabic')
      : props.defaultLanguage === 'en'
        ? t('languageEnglish')
        : t('languageAuto')
  const languageContext = isStoreLanguageAuto
    ? t('storeLanguageAutoHint')
    : t('storeLanguageFixedHint', { language: storeLanguageLabel })

  return (
    <BlockStack gap="400">
      <Layout>
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  {t('setupTitle')}
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  {t('setupDescription')}
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  {languageContext}
                </Text>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" fontWeight="medium">
                    {t('languageLabel')}
                  </Text>
                  <InlineStack gap="200">
                    {props.templateLanguages.includes('ar') && (
                      <Button
                        pressed={language === 'ar'}
                        onClick={() => setLanguage('ar')}
                      >
                        {t('languageArabic')}
                      </Button>
                    )}
                    {props.templateLanguages.includes('en') && (
                      <Button
                        pressed={language === 'en'}
                        onClick={() => setLanguage('en')}
                      >
                        {t('languageEnglish')}
                      </Button>
                    )}
                  </InlineStack>
                </BlockStack>
                <Select
                  label={t('styleLabel')}
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
                <Text as="p" tone="subdued" variant="bodySm">
                  {t('perLanguageStyleHint')}
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                {t('previewHeading')}
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                {t('previewDescription')}
              </Text>
              <Box
                background="bg-surface-secondary"
                borderRadius="300"
                padding="500"
              >
                <InlineStack align="center">
                  <div className="w-full max-w-[380px] rounded-2xl border border-[#d8d8d8] bg-[#efeae2] bg-[url('/images/landing/wa_chat_bg.png')] bg-cover bg-center p-3 shadow-sm">
                    <div
                      dir={isRtl ? 'rtl' : 'ltr'}
                      style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif' }}
                      className="overflow-hidden rounded-xl border border-[#e7e7e7] bg-white text-[#1e1f21]"
                    >
                      <div className="space-y-5 px-4 pt-4 pb-3 text-[15px] leading-6 font-normal">
                        {previewParagraphs.map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                      <div
                        className={`px-4 pb-2 text-[14px] text-[#8e8e93] ${
                          isRtl ? 'text-left' : 'text-right'
                        }`}
                      >
                        {formatTemplatePreviewTimestamp(language)}
                      </div>
                      <div
                        className={`border-t border-[#ececec] px-4 py-3 text-[#178959] ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center gap-2 text-[15px] leading-6 font-normal ${
                            isRtl ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <span className="text-[13px]">↩</span>
                          {template.confirmButton}
                        </span>
                      </div>
                      <div
                        className={`border-t border-[#ececec] px-4 py-3 text-[#178959] ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center gap-2 text-[15px] leading-6 font-normal ${
                            isRtl ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <span className="text-[13px]">↩</span>
                          {template.cancelButton}
                        </span>
                      </div>
                    </div>
                  </div>
                </InlineStack>
              </Box>
            </BlockStack>
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
  const activeTab = resolveSettingsTab(tabParam)
  const selected = SETTINGS_TABS.indexOf(activeTab)
  const canSaveActiveTab =
    activeTab === 'store' ||
    activeTab === 'confirmation' ||
    activeTab === 'message-preview'

  const tabs = [
    { id: 'store', content: t('tabs.store') },
    { id: 'confirmation', content: t('tabs.confirmation') },
    { id: 'message-preview', content: t('tabs.messageTemplate') },
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
