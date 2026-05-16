'use client'

import { useTranslations } from 'next-intl'
import type {
  IntegrationOnboardingLanguage,
  OnboardingBillingPlanId,
} from '@/features/onboarding'
import type { SettingsSkinProps } from '@/features/settings/domain/settings.types'
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
}: {
  value: TValue
  options: ReadonlyArray<{ label: string; value: TValue }>
  onChange: (value: TValue) => void
}) {
  return (
    <select
      value={value}
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
  const canChangePlan =
    props.selectedPlanId !== null &&
    props.selectedPlanId !== props.billingPlanId

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('title')}
        </h1>
        <p className="text-sm text-slate-500">{t('subtitle')}</p>
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

      <SectionCard title={t('storeConfigurationHeading')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('storeNameLabel')} error={props.storeNameError}>
            <Input
              value={props.storeName}
              onChange={(event) => props.onStoreNameChange(event.target.value)}
              autoComplete="organization"
            />
          </Field>

          <Field label={t('defaultLanguageLabel')}>
            <NativeSelect<IntegrationOnboardingLanguage>
              value={props.defaultLanguage}
              options={props.languageOptions}
              onChange={props.onDefaultLanguageChange}
            />
          </Field>

          <Field label={t('shippingCurrencyLabel')}>
            <NativeSelect
              value={props.shippingCurrency}
              options={props.shippingCurrencyOptions}
              onChange={props.onShippingCurrencyChange}
            />
          </Field>

          <Field
            label={t('avgShippingCostLabel')}
            helpText={t('avgShippingCostHelp')}
            error={props.avgShippingCostError}
          >
            <Input
              type="number"
              min={0}
              step={0.01}
              value={props.avgShippingCost}
              onChange={(event) =>
                props.onAvgShippingCostChange(event.target.value)
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={t('subscriptionHeading')}>
        <div id={SUBSCRIPTION_SECTION_ID} className="space-y-5">
          <div className="space-y-1">
            <p className="text-sm text-slate-700">
              {props.activePlanName
                ? t('subscriptionCurrentPlan', { plan: props.activePlanName })
                : t('subscriptionNoPlan')}
            </p>
          </div>

          {props.usageData && (
            <StandaloneUsageOverview
              used={props.usageData.used}
              limit={props.usageData.limit}
              usedLabel={props.usageData.usedLabel}
              limitLabel={props.usageData.limitLabel}
              upgradePrompt={props.usageData.upgradePrompt}
            />
          )}

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
    </div>
  )
}
