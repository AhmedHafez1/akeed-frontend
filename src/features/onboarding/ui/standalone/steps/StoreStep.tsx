'use client'

import { useMemo, type FormEvent, type Ref } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Send } from 'lucide-react'
import { fetchTemplatePreviews } from '@/features/onboarding/api/onboardingApi'
import {
  AUTOMATION_TIMEZONES,
  type AutomationTimezone,
  type IntegrationOnboardingLanguage,
} from '@/features/onboarding/domain/onboarding.types'
import type { StandaloneOnboardingFlow } from '@/features/onboarding/hooks/useStandaloneOnboardingFlow'
import {
  currencyLabel,
  previewLanguageFor,
  STANDALONE_FIELD_IDS,
} from '@/features/onboarding/model/standaloneStore'
import {
  orderCurrencies,
  type OrderCurrency,
} from '@/shared/commerce/orderCommerce'
import { cn } from '@/shared/lib/utils'
import { queryKeys } from '@/shared/query/keys'
import {
  Button,
  Input,
  InternationalPhoneInput,
  Skeleton,
  akCard,
  type E164Value,
} from '@/shared/ui'
import {
  CreditsBanner,
  DefaultsWell,
  MessagePhonePreview,
  NativeSelect,
  OnboardingField,
  type DefaultsWellRow,
} from '../components'

const LANGUAGES: readonly IntegrationOnboardingLanguage[] = ['auto', 'ar', 'en']

const WARNING_FIELD =
  'border-ak-warning ring-ak-warning-soft focus:border-ak-warning ring-4'

interface StoreStepProps {
  store: StandaloneOnboardingFlow['store']
  isLoading: boolean
  canManage: boolean
  headingRef: Ref<HTMLHeadingElement>
  onSubmit: () => void
}

/**
 * Step "Your store": the one thing only the merchant knows (their WhatsApp
 * number), the store name we already have, and the defaults we picked for
 * them, with the message their customers will get beside it.
 */
export function StoreStep({
  store,
  isLoading,
  canManage,
  headingRef,
  onSubmit,
}: StoreStepProps) {
  const t = useTranslations('standaloneOnboarding.store')
  const locale = useLocale()
  const { form, fieldErrors } = store
  const disabled = !canManage || store.isSubmitting

  const previews = useQuery({
    queryKey: queryKeys.onboarding.templatePreviews(),
    queryFn: fetchTemplatePreviews,
    staleTime: Infinity,
    enabled: !isLoading,
  })
  const previewLanguage = previewLanguageFor(form)

  const languageOptions = useMemo(
    () =>
      LANGUAGES.map((value) => ({
        value,
        label: t(`languageOptions.${value}`),
      })),
    [t]
  )
  const currencyOptions = useMemo(
    () =>
      orderCurrencies.map((value) => ({
        value,
        label: currencyLabel(value, locale),
      })),
    [locale]
  )
  const timezoneOptions = useMemo(
    () =>
      AUTOMATION_TIMEZONES.map((value) => ({
        value,
        label: t(`timezones.${value.replace('/', '_')}`),
      })),
    [t]
  )

  const labelOf = <TValue extends string>(
    options: ReadonlyArray<{ value: TValue; label: string }>,
    value: TValue
  ) => options.find((option) => option.value === value)?.label ?? value

  const defaultsRows: DefaultsWellRow[] = [
    {
      id: 'onboarding-default-language',
      label: t('defaults.language'),
      valueLabel: labelOf(languageOptions, form.language),
      control: (
        <NativeSelect<IntegrationOnboardingLanguage>
          id="onboarding-default-language-select"
          value={form.language}
          options={languageOptions}
          disabled={disabled}
          onChange={store.setLanguage}
        />
      ),
    },
    {
      id: 'onboarding-default-currency',
      label: t('defaults.currency'),
      valueLabel: labelOf(currencyOptions, form.currency),
      control: (
        <NativeSelect<OrderCurrency>
          id="onboarding-default-currency-select"
          value={form.currency}
          options={currencyOptions}
          disabled={disabled}
          onChange={store.setCurrency}
        />
      ),
    },
    {
      id: 'onboarding-default-timezone',
      label: t('defaults.timezone'),
      valueLabel: labelOf(timezoneOptions, form.timezone),
      control: (
        <NativeSelect<AutomationTimezone>
          id="onboarding-default-timezone-select"
          value={form.timezone}
          options={timezoneOptions}
          disabled={disabled}
          onChange={store.setTimezone}
        />
      ),
    },
  ]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isLoading && canManage) onSubmit()
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">
      <form
        noValidate
        onSubmit={handleSubmit}
        aria-busy={isLoading || store.isSubmitting}
        className={cn(akCard, 'overflow-hidden')}
      >
        <div className="space-y-6 p-5 text-start sm:p-8">
          <header className="space-y-2">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-ink text-h2 font-bold focus-visible:outline-none"
            >
              {t('heading')}
            </h1>
            <p className="text-ink-muted text-body">{t('subheading')}</p>
          </header>

          {store.saveError && (
            <div
              role="alert"
              className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-panel flex items-start gap-2 border p-4 text-sm"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              {store.saveError}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6" aria-hidden="true">
              <Skeleton className="rounded-panel h-[76px] w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <Skeleton className="rounded-panel h-40 w-full" />
            </div>
          ) : (
            <>
              <CreditsBanner />

              <OnboardingField
                htmlFor={STANDALONE_FIELD_IDS.storeName}
                label={t('storeName.label')}
                helpText={t('storeName.hint')}
                error={fieldErrors.storeName}
              >
                {({ describedBy }) => (
                  <Input
                    id={STANDALONE_FIELD_IDS.storeName}
                    value={form.storeName}
                    placeholder={t('storeName.placeholder')}
                    autoComplete="organization"
                    disabled={disabled}
                    aria-invalid={!!fieldErrors.storeName}
                    aria-describedby={describedBy}
                    onChange={(event) => store.setStoreName(event.target.value)}
                    className={cn(
                      'border-control-border bg-card',
                      fieldErrors.storeName && WARNING_FIELD
                    )}
                  />
                )}
              </OnboardingField>

              <OnboardingField
                htmlFor={STANDALONE_FIELD_IDS.merchantWhatsappPhone}
                label={t('phone.label')}
                helpText={t('phone.hint')}
                error={fieldErrors.merchantWhatsappPhone}
              >
                {({ describedBy }) => (
                  <InternationalPhoneInput
                    id={STANDALONE_FIELD_IDS.merchantWhatsappPhone}
                    value={(form.phone || undefined) as E164Value | undefined}
                    defaultCountry={form.phoneCountry}
                    onChange={(value) => store.setPhone(value ?? '')}
                    onCountryChange={(country) => {
                      if (country) store.setPhoneCountry(country)
                    }}
                    disabled={disabled}
                    aria-invalid={!!fieldErrors.merchantWhatsappPhone}
                    aria-describedby={describedBy}
                    validateWhileTyping={false}
                    errorTone="warning"
                  />
                )}
              </OnboardingField>

              <section
                aria-labelledby="onboarding-defaults-heading"
                className="space-y-2"
              >
                <h2
                  id="onboarding-defaults-heading"
                  className="text-ink text-sm font-semibold"
                >
                  {t('defaults.heading')}
                </h2>
                <DefaultsWell
                  rows={defaultsRows}
                  caption={t('defaults.caption')}
                />
              </section>
            </>
          )}
        </div>

        <div className="border-line bg-surface-sunken flex flex-col gap-4 border-t p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-ink-muted text-sm" aria-live="polite">
            {isLoading ? t('loading') : t('footerCaption')}
          </p>
          {canManage && (
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || store.isSubmitting}
              className="w-full gap-2 px-6 font-semibold sm:w-auto"
            >
              {store.isSubmitting ? t('submitting') : t('submit')}
              <Send aria-hidden="true" className="rtl:-scale-x-100" />
            </Button>
          )}
        </div>
      </form>

      <aside className="hidden lg:block" aria-label={t('preview.label')}>
        <p className="text-ink-muted mb-4 text-center text-sm font-medium">
          {t('preview.label')}
        </p>
        {!previews.isError && (
          <MessagePhonePreview
            template={previews.data?.[previewLanguage] ?? null}
            language={previewLanguage}
            storeName={form.storeName}
            currency={form.currency}
          />
        )}
      </aside>
    </div>
  )
}
