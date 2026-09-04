'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type {
  ArabicCodTemplateVariantId,
  AutomationTimezone,
  EnglishCodTemplateVariantId,
  IntegrationOnboardingLanguage,
  OnboardingBillingPlanId,
} from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'
import {
  formatTemplatePreviewTimestamp,
  getTemplatePreviewParagraphs,
} from '@/features/settings/skins/shared/templatePreview'
import { Button, Card, Input, Label } from '@/shared/ui'

const SUBSCRIPTION_SECTION_ID = 'subscription-usage'

interface FieldProps {
  label: string
  error?: string
  helpText?: string
  children: React.ReactNode
}

function Field({ label, error, helpText, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {helpText && (
          <span
            title={helpText}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500"
          >
            ?
          </span>
        )}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function NativeSelect<TValue extends string>({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: TValue
  options: ReadonlyArray<{ label: string; value: TValue }>
  onChange: (value: TValue) => void
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as TValue)}
      className="h-12 w-full rounded-lg border-2 border-gray-200 bg-white px-4 text-base transition-colors outline-none focus:border-emerald-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>
    </label>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
        {children}
      </div>
    </Card>
  )
}

function StandaloneUsageOverview({
  used,
  limit,
  usedLabel,
  limitLabel,
  upgradePrompt,
}: {
  used: number
  limit: number
  usedLabel: string
  limitLabel: string
  upgradePrompt: string | null
}) {
  const safeLimit = Math.max(limit, 1)
  const usagePercent = Math.min(100, Math.round((used / safeLimit) * 100))

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-900">
          {used} / {limit}
        </span>
        <span className="text-slate-500">{limitLabel}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${
            usagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">{usedLabel}</p>
      {upgradePrompt && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          {upgradePrompt}
        </p>
      )}
    </div>
  )
}

function StandalonePlanComparison({
  plans,
  currentPlanId,
  selectedPlanId,
  disabledPlanIds = [],
  disabledPlanTooltips = {},
  currentBadgeLabel,
  onPlanSelect,
}: {
  plans: SettingsSkinProps['planOptions']
  currentPlanId: OnboardingBillingPlanId | null
  selectedPlanId: OnboardingBillingPlanId | null
  disabledPlanIds?: OnboardingBillingPlanId[]
  disabledPlanTooltips?: Partial<Record<OnboardingBillingPlanId, string>>
  currentBadgeLabel: string
  onPlanSelect: (planId: OnboardingBillingPlanId) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            className={`rounded-2xl border p-4 text-center transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex min-h-12 flex-col items-center justify-start gap-1">
              <p className="font-semibold text-slate-900">{plan.name}</p>
              {isCurrent && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {currentBadgeLabel}
                </span>
              )}
            </div>
            <p
              dir="auto"
              className="mt-3 text-xl leading-7 font-bold text-slate-900 [unicode-bidi:isolate]"
            >
              {plan.priceLabel}
            </p>
            <p
              dir="auto"
              className="mx-auto mt-2 max-w-40 text-sm text-slate-500 [unicode-bidi:isolate]"
            >
              {plan.volumeLabel}
            </p>
          </button>
        )
      })}
    </div>
  )
}

export function SettingsStandaloneSkin(props: SettingsSkinProps) {
  const t = useTranslations('settings')
  const previewT = useTranslations('messageTemplate')
  const initialLanguage =
    props.defaultLanguage === 'ar' || props.defaultLanguage === 'en'
      ? props.defaultLanguage
      : props.defaultTemplateLanguage
  const [previewLanguage, setPreviewLanguage] = useState<'ar' | 'en'>(
    initialLanguage
  )
  const canChangePlan =
    props.canManageBilling &&
    props.selectedPlanId !== null &&
    props.selectedPlanId !== props.billingPlanId

  const selectedVariant =
    previewLanguage === 'ar'
      ? props.selectedCodTemplateVariants.ar
      : props.selectedCodTemplateVariants.en
  const availableVariants = props.codTemplateVariants[previewLanguage]
  const selectedDefinition = availableVariants.find(
    (variant) => variant.variant === selectedVariant
  )
  const template =
    selectedDefinition?.preview ?? props.templatePreviews[previewLanguage]
  const previewParagraphs = getTemplatePreviewParagraphs(
    template,
    props.storeName
  )
  const variantOptions = availableVariants.map((variant) => ({
    label: previewT(`variantLabels.${variant.variant}`),
    value: variant.variant,
  }))
  const defaultVariant = props.codTemplateDefaults[previewLanguage]
  const isDefaultVariant = selectedVariant === defaultVariant
  const isStoreLanguageAuto = props.defaultLanguage === 'auto'
  const storeLanguageLabel =
    props.defaultLanguage === 'ar'
      ? previewT('languageArabic')
      : props.defaultLanguage === 'en'
        ? previewT('languageEnglish')
        : previewT('languageAuto')
  const languageContext = isStoreLanguageAuto
    ? previewT('storeLanguageAutoHint')
    : previewT('storeLanguageFixedHint', { language: storeLanguageLabel })

  const handleVariantChange = (value: string) => {
    if (previewLanguage === 'ar') {
      props.onCodTemplateArVariantChange(value as ArabicCodTemplateVariantId)
      return
    }

    props.onCodTemplateEnVariantChange(value as EnglishCodTemplateVariantId)
  }

  if (props.isLoadError) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card className="border-red-200 p-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
          <p className="mt-3 text-sm text-red-700">{t('loadError')}</p>
          <Button className="mt-5" onClick={props.onRetry}>
            {t('retryButton')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        {props.canUpdateConfiguration && (
          <Button
            type="button"
            disabled={props.isSaving}
            onClick={() => void props.onSave()}
          >
            {props.isSaving ? t('savingButton') : t('saveButton')}
          </Button>
        )}
      </div>

      {props.errorBanner && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {props.errorBanner}
        </div>
      )}

      {props.successBanner && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {props.successBanner}
        </div>
      )}

      {!props.canUpdateConfiguration && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {t('readOnly')}
        </div>
      )}

      <SectionCard title={t('sourceHeading')}>
        <p className="text-sm font-medium text-emerald-700">
          {props.sourcePlatformType === 'standalone'
            ? t('sourceStandalone')
            : props.sourcePlatformType}
        </p>
        <code
          dir="ltr"
          className="block rounded-lg bg-slate-50 p-3 text-xs break-all text-slate-700"
        >
          {props.sourceIdentity}
        </code>
      </SectionCard>

      <SectionCard title={t('storeConfigurationHeading')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('storeNameLabel')} error={props.storeNameError}>
            <Input
              value={props.storeName}
              disabled={!props.canUpdateConfiguration}
              onChange={(event) => props.onStoreNameChange(event.target.value)}
              autoComplete="organization"
            />
          </Field>

          <Field label={t('defaultLanguageLabel')}>
            <NativeSelect<IntegrationOnboardingLanguage>
              value={props.defaultLanguage}
              options={props.languageOptions}
              disabled={!props.canUpdateConfiguration}
              onChange={props.onDefaultLanguageChange}
            />
          </Field>
        </div>
        <ToggleRow
          label={t('codDefaultLabel')}
          description={t('codDefaultHelp')}
          checked={props.assumeCodWhenPaymentMissing}
          disabled={!props.canUpdateConfiguration}
          onChange={props.onAssumeCodWhenPaymentMissingChange}
        />
      </SectionCard>

      <SectionCard
        title={t('automation.heading')}
        description={t('automation.description')}
      >
        <ToggleRow
          label={t('autoVerifyLabel')}
          description={t('autoVerifyDescription')}
          checked={props.isAutoVerifyEnabled}
          disabled={!props.canUpdateConfiguration}
          onChange={props.onAutoVerifyChange}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={t('automation.sendDelayMinutesLabel')}
            error={props.sendDelayMinutesError}
          >
            <Input
              type="number"
              min={0}
              max={24}
              step={0.25}
              disabled={!props.canUpdateConfiguration}
              value={props.sendDelayMinutes}
              onChange={(event) =>
                props.onSendDelayMinutesChange(event.target.value)
              }
            />
          </Field>
          <Field label={t('automation.timezoneLabel')}>
            <NativeSelect<AutomationTimezone>
              value={props.timezone}
              options={props.timezoneOptions}
              disabled={!props.canUpdateConfiguration}
              onChange={props.onTimezoneChange}
            />
          </Field>
        </div>
        <ToggleRow
          label={t('automation.followUpEnabledLabel')}
          description={t('automation.followUpEnabledHelp')}
          checked={props.followUpEnabled}
          disabled={!props.canUpdateConfiguration}
          onChange={props.onFollowUpEnabledChange}
        />
        <Field
          label={t('automation.followUpDelayMinutesLabel')}
          error={props.followUpDelayMinutesError}
        >
          <Input
            type="number"
            min={0}
            max={168}
            step={0.25}
            disabled={!props.canUpdateConfiguration || !props.followUpEnabled}
            value={props.followUpDelayMinutes}
            onChange={(event) =>
              props.onFollowUpDelayMinutesChange(event.target.value)
            }
          />
        </Field>
        <ToggleRow
          label={t('automation.escalationEnabledLabel')}
          description={t('automation.escalationEnabledHelp')}
          checked={props.escalationEnabled}
          disabled={!props.canUpdateConfiguration}
          onChange={props.onEscalationEnabledChange}
        />
        <Field
          label={t('automation.escalationDelayMinutesLabel')}
          error={props.escalationDelayMinutesError}
        >
          <Input
            type="number"
            min={0}
            max={168}
            step={0.25}
            disabled={!props.canUpdateConfiguration || !props.escalationEnabled}
            value={props.escalationDelayMinutes}
            onChange={(event) =>
              props.onEscalationDelayMinutesChange(event.target.value)
            }
          />
        </Field>
        <ToggleRow
          label={t('automation.quietHoursEnabledLabel')}
          description={t('automation.quietHoursEnabledHelp')}
          checked={props.quietHoursEnabled}
          disabled={!props.canUpdateConfiguration}
          onChange={props.onQuietHoursEnabledChange}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={t('automation.quietHoursStartLabel')}
            error={props.quietHoursError}
          >
            <Input
              type="time"
              disabled={
                !props.canUpdateConfiguration || !props.quietHoursEnabled
              }
              value={props.quietHoursStart}
              onChange={(event) =>
                props.onQuietHoursStartChange(event.target.value)
              }
            />
          </Field>
          <Field label={t('automation.quietHoursEndLabel')}>
            <Input
              type="time"
              disabled={
                !props.canUpdateConfiguration || !props.quietHoursEnabled
              }
              value={props.quietHoursEnd}
              onChange={(event) =>
                props.onQuietHoursEndChange(event.target.value)
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title={
          props.sourcePlatformType === 'standalone'
            ? t('pilotAccessHeading')
            : t('subscriptionHeading')
        }
      >
        <div id={SUBSCRIPTION_SECTION_ID} className="space-y-5">
          <div className="space-y-1">
            <p className="text-sm text-slate-700">
              {props.activePlanName
                ? t('subscriptionCurrentPlan', { plan: props.activePlanName })
                : t('subscriptionNoPlan')}
            </p>
          </div>

          <p className="text-sm text-slate-600">{props.billingStatusLabel}</p>

          {props.usageData && (
            <StandaloneUsageOverview
              used={props.usageData.used}
              limit={props.usageData.limit}
              usedLabel={props.usageData.usedLabel}
              limitLabel={props.usageData.limitLabel}
              upgradePrompt={props.usageData.upgradePrompt}
            />
          )}

          {props.canManageBilling && (
            <StandalonePlanComparison
              plans={props.planOptions}
              currentPlanId={props.billingPlanId}
              selectedPlanId={props.selectedPlanId}
              disabledPlanIds={props.isFreePlanClaimed ? ['starter'] : []}
              disabledPlanTooltips={
                props.isFreePlanClaimed
                  ? { starter: t('freePlanAlreadyClaimedTooltip') }
                  : undefined
              }
              currentBadgeLabel={t('currentPlanBadge')}
              onPlanSelect={props.onPlanSelect}
            />
          )}

          {canChangePlan && (
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={props.isChangingPlan}
                onClick={() => void props.onChangePlan()}
              >
                {props.isChangingPlan
                  ? t('changingPlanButton')
                  : t('changePlanButton')}
              </Button>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={previewT('setupTitle')}
        description={previewT('setupDescription')}
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-500">{languageContext}</p>

          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Field label={previewT('languageLabel')}>
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
                  {props.templateLanguages.includes('ar') && (
                    <Button
                      type="button"
                      variant={previewLanguage === 'ar' ? 'default' : 'ghost'}
                      size="sm"
                      disabled={!props.canUpdateConfiguration}
                      onClick={() => setPreviewLanguage('ar')}
                    >
                      {previewT('languageArabic')}
                    </Button>
                  )}
                  {props.templateLanguages.includes('en') && (
                    <Button
                      type="button"
                      variant={previewLanguage === 'en' ? 'default' : 'ghost'}
                      size="sm"
                      disabled={!props.canUpdateConfiguration}
                      onClick={() => setPreviewLanguage('en')}
                    >
                      {previewT('languageEnglish')}
                    </Button>
                  )}
                </div>
              </Field>

              <Field label={previewT('styleLabel')}>
                <NativeSelect
                  value={selectedVariant}
                  options={variantOptions}
                  disabled={!props.canUpdateConfiguration}
                  onChange={handleVariantChange}
                />
                <p className="mt-2 text-xs text-slate-500">
                  {previewT('defaultVariantLabel', {
                    variant: previewT(`variantLabels.${defaultVariant}`),
                  })}
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  {isDefaultVariant
                    ? previewT('badgeDefault')
                    : previewT('badgeCustom')}
                </p>
              </Field>
              <p className="text-xs text-slate-500">
                {previewT('perLanguageStyleHint')}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                {previewT('previewDescription')}
              </p>
              <div className="mx-auto w-full max-w-[380px] rounded-2xl border border-[#d8d8d8] bg-[#efeae2] bg-[url('/images/landing/wa_chat_bg.png')] bg-cover bg-center p-3 shadow-sm">
                <div
                  dir={previewLanguage === 'ar' ? 'rtl' : 'ltr'}
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
                      previewLanguage === 'ar' ? 'text-left' : 'text-right'
                    }`}
                  >
                    {formatTemplatePreviewTimestamp(previewLanguage)}
                  </div>
                  <div
                    className={`border-t border-[#ececec] px-4 py-3 text-[#178959] ${
                      previewLanguage === 'ar' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center gap-2 text-[15px] leading-6 font-normal ${
                        previewLanguage === 'ar'
                          ? 'flex-row-reverse'
                          : 'flex-row'
                      }`}
                    >
                      <span className="text-[13px]">↩</span>
                      {template.confirmButton}
                    </span>
                  </div>
                  <div
                    className={`border-t border-[#ececec] px-4 py-3 text-[#178959] ${
                      previewLanguage === 'ar' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center gap-2 text-[15px] leading-6 font-normal ${
                        previewLanguage === 'ar'
                          ? 'flex-row-reverse'
                          : 'flex-row'
                      }`}
                    >
                      <span className="text-[13px]">↩</span>
                      {template.cancelButton}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
