'use client'

import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import {
  currencyForCountry,
  orderCountries,
  orderCurrencies,
} from '@/shared/commerce/orderCommerce'
import { cn } from '@/shared/lib/utils'
import { AkSelect, Label, LoadingButton, akCard } from '@/shared/ui'
import { Notice } from '../connect/connectUi'
import type {
  EasyOrdersConnectionDetails,
  EasyOrdersOrderSettings,
} from './easyOrders.types'

const FIELD_IDS = {
  phoneCountry: 'easyorders-phone-country',
  currency: 'easyorders-currency',
} as const

const SECTION_IDS = {
  orderSettings: 'easyorders-order-settings-heading',
  secrets: 'easyorders-secrets-heading',
} as const

type SettingsField = keyof typeof FIELD_IDS

const SETTINGS_FIELDS: readonly SettingsField[] = ['phoneCountry', 'currency']

interface EasyOrdersDetailsStepProps {
  connection: EasyOrdersConnectionDetails
  canManage: boolean
  isSaving: boolean
  /** The last save failed on the server. */
  settingsFailed: boolean
  onSaveSettings: (settings: EasyOrdersOrderSettings) => Promise<boolean>
  /** Everything is stored; go on to the number. */
  onContinue: () => void
  /** The connection line: the store these details belong to. */
  lead: ReactNode
  /** Problems with the store itself, shown before the fields. */
  attention?: ReactNode
  headingRef: Ref<HTMLHeadingElement>
}

function displayNames(locale: string, type: 'region' | 'currency') {
  try {
    return new Intl.DisplayNames([locale], { type })
  } catch {
    return null
  }
}

/**
 * Step "Store details" of an EasyOrders setup: the two things only this
 * platform needs. EasyOrders sends amounts without a currency and phone
 * numbers without a country code. The secret each webhook carries is not
 * asked for: Akeed learns it from the first order, and the step says so.
 */
export function EasyOrdersDetailsStep({
  connection,
  canManage,
  isSaving,
  settingsFailed,
  onSaveSettings,
  onContinue,
  lead,
  attention,
  headingRef,
}: EasyOrdersDetailsStepProps) {
  const t = useTranslations('easyOrdersConnect.details')
  const tSettings = useTranslations('easyOrdersConnect.success.orderSettings')
  const tSecrets = useTranslations('easyOrdersConnect.success.secrets')
  const locale = useLocale()
  const [settings, setSettings] = useState<EasyOrdersOrderSettings>({
    currency: connection.currency ?? '',
    phoneCountry: connection.phoneCountry ?? '',
  })
  const [missing, setMissing] = useState(false)
  const disabled = !canManage || isSaving

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

  const setSetting = (field: SettingsField, value: string) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
      // A market's own currency is the likely one; the merchant can change it.
      ...(field === 'phoneCountry' && !previous.currency
        ? { currency: currencyForCountry(value) ?? '' }
        : {}),
    }))
    setMissing(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return

    const emptySetting = SETTINGS_FIELDS.find((field) => !settings[field])
    if (emptySetting) {
      setMissing(true)
      document.getElementById(FIELD_IDS[emptySetting])?.focus()
      return
    }
    setMissing(false)

    const settingsChanged =
      settings.currency !== connection.currency ||
      settings.phoneCountry !== connection.phoneCountry
    if (settingsChanged && !(await onSaveSettings(settings))) return
    onContinue()
  }

  const errorMessage = missing
    ? tSettings('errors.required')
    : settingsFailed
      ? tSettings('errors.failed')
      : null

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
      aria-busy={isSaving}
      className={cn(akCard, 'overflow-hidden')}
    >
      <div className="space-y-6 p-5 text-start sm:p-8">
        {lead}

        <header className="space-y-2">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-ink text-h2 font-bold focus-visible:outline-none"
          >
            {t('title')}
          </h1>
          <p className="text-ink-muted text-body">{t('body')}</p>
        </header>

        {attention}

        <section
          aria-labelledby={SECTION_IDS.orderSettings}
          className="space-y-4"
        >
          <h2
            id={SECTION_IDS.orderSettings}
            className="text-ink text-lg font-bold"
          >
            {tSettings('title')}
          </h2>
          <p className="text-ink-muted text-sm">
            {tSettings('body')}
            {!(connection.currency && connection.phoneCountry) && (
              <> {tSettings('warning')}</>
            )}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SETTINGS_FIELDS.map((name) => (
              <div key={name} className="space-y-2">
                <Label
                  htmlFor={FIELD_IDS[name]}
                  className="text-ink text-sm font-semibold"
                >
                  {tSettings(`${name}.label`)}
                </Label>
                <AkSelect
                  id={FIELD_IDS[name]}
                  name={name}
                  value={settings[name]}
                  disabled={disabled}
                  onChange={(event) => setSetting(name, event.target.value)}
                  aria-describedby={`${FIELD_IDS[name]}-hint`}
                  aria-invalid={missing && !settings[name] ? true : undefined}
                  options={[
                    { value: '', label: tSettings(`${name}.placeholder`) },
                    ...options[name],
                  ]}
                />
                <p
                  id={`${FIELD_IDS[name]}-hint`}
                  className="text-ink-muted text-sm"
                >
                  {tSettings(`${name}.hint`)}
                </p>
              </div>
            ))}
          </div>
          {errorMessage && (
            <Notice
              tone="destructive"
              icon={<AlertCircle aria-hidden="true" />}
            >
              {errorMessage}
            </Notice>
          )}
        </section>

        <section
          aria-labelledby={SECTION_IDS.secrets}
          className="border-line space-y-2 border-t pt-6"
        >
          <h2
            id={SECTION_IDS.secrets}
            className="text-ink flex items-center gap-2 text-lg font-bold"
          >
            <ShieldCheck
              aria-hidden="true"
              className="text-success-subtle-foreground size-5 shrink-0"
            />
            {tSecrets('automaticTitle')}
          </h2>
          <p className="text-ink-muted text-sm">{tSecrets('automatic')}</p>
        </section>
      </div>

      <div className="border-line bg-surface-sunken flex flex-col gap-4 border-t p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-ink-muted text-sm">{t('footerCaption')}</p>
        <LoadingButton
          type="submit"
          size="lg"
          className="w-full shrink-0 gap-2 px-6 font-semibold sm:w-auto"
          disabled={!canManage}
          loading={isSaving}
          loadingText={t('saving')}
        >
          {t('submit')}
        </LoadingButton>
      </div>
    </form>
  )
}
