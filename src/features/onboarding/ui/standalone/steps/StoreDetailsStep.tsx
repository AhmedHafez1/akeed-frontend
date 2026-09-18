'use client'

import { useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import type {
  IntegrationOnboardingLanguage,
  StandaloneSetupFieldErrors,
} from '@/features/onboarding/domain/onboarding.types'
import type { StandaloneSetupForm } from '@/features/onboarding/hooks/useStandaloneOnboarding'
import { STANDALONE_FIELD_IDS } from '@/features/onboarding/model/onboarding.steps'
import { Input } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { OnboardingField, SegmentedControl } from '../components'

interface StoreDetailsStepProps {
  form: StandaloneSetupForm
  fieldErrors: StandaloneSetupFieldErrors
  disabled: boolean
  onFieldChange: <TKey extends keyof StandaloneSetupForm>(
    key: TKey,
    value: StandaloneSetupForm[TKey]
  ) => void
}

export function StoreDetailsStep({
  form,
  fieldErrors,
  disabled,
  onFieldChange,
}: StoreDetailsStepProps) {
  const t = useTranslations('standaloneOnboarding')

  const languageOptions = [
    { value: 'auto', label: t('language.auto') },
    { value: 'ar', label: t('language.arabic') },
    { value: 'en', label: t('language.english') },
  ] as const satisfies ReadonlyArray<{
    value: IntegrationOnboardingLanguage
    label: string
  }>

  return (
    <div className="space-y-6">
      <OnboardingField
        htmlFor={STANDALONE_FIELD_IDS.storeName}
        label={t('storeName')}
        helpText={t('storeNameHelp')}
        error={fieldErrors.storeName}
        required
      >
        {({ describedBy }) => (
          <Input
            id={STANDALONE_FIELD_IDS.storeName}
            value={form.storeName}
            disabled={disabled}
            required
            placeholder={t('storeNamePlaceholder')}
            aria-invalid={fieldErrors.storeName ? true : undefined}
            aria-describedby={describedBy}
            onChange={(event) => onFieldChange('storeName', event.target.value)}
            className={cn(
              'text-start',
              fieldErrors.storeName &&
                'border-destructive focus:border-destructive'
            )}
          />
        )}
      </OnboardingField>

      <div className="mt-7 space-y-2 text-start">
        <p className="text-foreground text-sm font-medium" id="language-label">
          {t('languageHeading')}
        </p>
        <SegmentedControl
          label={t('languageHeading')}
          value={form.defaultLanguage}
          options={languageOptions}
          disabled={disabled}
          describedBy="language-help"
          onChange={(value) => onFieldChange('defaultLanguage', value)}
        />
        <p
          id="language-help"
          className="text-foreground/70 flex items-start gap-2 py-2.5 text-xs leading-5"
        >
          <Globe
            aria-hidden="true"
            className="text-muted-foreground/70 mt-px h-4 w-4 shrink-0"
          />
          {t('languageAutoHelp')}
        </p>
      </div>
    </div>
  )
}
