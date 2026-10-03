'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  currencyForCountry,
  orderCountries,
  orderCurrencies,
} from '@/shared/commerce/orderCommerce'
import { AkSelect, Label, LoadingButton } from '@/shared/ui'
import type { EasyOrdersOrderSettings } from './easyOrders.types'

const FIELD_IDS = {
  phoneCountry: 'easyorders-phone-country',
  currency: 'easyorders-currency',
} as const

type SettingsField = keyof typeof FIELD_IDS
type FormError = 'required' | 'failed'

interface OrderSettingsFormProps {
  /** What is stored already; null until the merchant chooses. */
  currency: string | null
  phoneCountry: string | null
  canManage: boolean
  isSaving: boolean
  saved: boolean
  failed: boolean
  onSave: (settings: EasyOrdersOrderSettings) => Promise<boolean>
}

function displayNames(locale: string, type: 'region' | 'currency') {
  try {
    return new Intl.DisplayNames([locale], { type })
  } catch {
    return null
  }
}

/**
 * EasyOrders sends amounts without a currency and phone numbers without a
 * country code, so the merchant states both once. Until they do, no order
 * from the store is confirmed.
 */
export function OrderSettingsForm({
  currency,
  phoneCountry,
  canManage,
  isSaving,
  saved,
  failed,
  onSave,
}: OrderSettingsFormProps) {
  const t = useTranslations('easyOrdersConnect.success.orderSettings')
  const locale = useLocale()
  const [values, setValues] = useState<EasyOrdersOrderSettings>({
    currency: currency ?? '',
    phoneCountry: phoneCountry ?? '',
  })
  const [localError, setLocalError] = useState<FormError | null>(null)
  const error: FormError | null = localError ?? (failed ? 'failed' : null)
  const alreadySet = Boolean(currency && phoneCountry)

  const options = useMemo(() => {
    const regions = displayNames(locale, 'region')
    const currencies = displayNames(locale, 'currency')
    return {
      phoneCountry: orderCountries.map((code) => ({
        value: code,
        label: regions?.of(code) ?? code,
      })),
      currency: orderCurrencies.map((code) => ({
        value: code,
        label: `${code} · ${currencies?.of(code) ?? code}`,
      })),
    }
  }, [locale])

  const setValue = (field: SettingsField, value: string) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
      // A market's own currency is the likely one; the merchant can change it.
      ...(field === 'phoneCountry' && !previous.currency
        ? { currency: currencyForCountry(value) ?? '' }
        : {}),
    }))
    setLocalError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const firstEmpty = (['phoneCountry', 'currency'] as const).find(
      (field) => !values[field]
    )
    if (firstEmpty) {
      setLocalError('required')
      document.getElementById(FIELD_IDS[firstEmpty])?.focus()
      return
    }
    setLocalError(null)
    await onSave(values)
  }

  const field = (name: SettingsField) => (
    <div className="space-y-2">
      <Label
        htmlFor={FIELD_IDS[name]}
        className="text-ink text-sm font-semibold"
      >
        {t(`${name}.label`)}
      </Label>
      <AkSelect
        id={FIELD_IDS[name]}
        name={name}
        value={values[name]}
        disabled={!canManage || isSaving}
        onChange={(event) => setValue(name, event.target.value)}
        aria-describedby={`${FIELD_IDS[name]}-hint`}
        aria-invalid={error === 'required' && !values[name] ? true : undefined}
        options={[{ value: '', label: t(`${name}.placeholder`) }].concat(
          options[name]
        )}
      />
      <p id={`${FIELD_IDS[name]}-hint`} className="text-ink-muted text-sm">
        {t(`${name}.hint`)}
      </p>
    </div>
  )

  return (
    <form
      className="space-y-5 text-start"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
      aria-busy={isSaving}
    >
      <div className="space-y-2">
        <h2 className="text-ink text-lg font-bold">{t('title')}</h2>
        <p className="text-ink-muted text-sm">{t('body')}</p>
        {!alreadySet && (
          <p className="border-warning-border bg-warning-subtle text-warning-subtle-foreground rounded-panel border p-3 text-sm">
            {t('warning')}
          </p>
        )}
      </div>

      {field('phoneCountry')}
      {field('currency')}

      {error && (
        <p
          role="alert"
          className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-panel flex items-start gap-2 border p-3 text-sm"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t(`errors.${error}`)}
        </p>
      )}
      {saved && !error && (
        <p
          role="status"
          className="border-success-border bg-success-subtle text-success-subtle-foreground rounded-panel flex items-start gap-2 border p-3 text-sm"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t('saved')}
        </p>
      )}

      <LoadingButton
        type="submit"
        size="lg"
        className="w-full px-8 font-semibold sm:w-auto"
        disabled={!canManage}
        loading={isSaving}
        loadingText={t('saving')}
      >
        {t('save')}
      </LoadingButton>
    </form>
  )
}
