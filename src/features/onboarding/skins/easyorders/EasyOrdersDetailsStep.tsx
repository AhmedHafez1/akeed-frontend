'use client'

import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import {
  currencyForCountry,
  orderCountries,
  orderCurrencies,
} from '@/shared/commerce/orderCommerce'
import { cn } from '@/shared/lib/utils'
import { AkSelect, Input, Label, LoadingButton, akCard } from '@/shared/ui'
import { Notice } from '../connect/connectUi'
import {
  isValidWebhookSecret,
  type EasyOrdersConnectionDetails,
  type EasyOrdersOrderSettings,
  type EasyOrdersWebhookSecrets,
} from './easyOrders.types'

const FIELD_IDS = {
  phoneCountry: 'easyorders-phone-country',
  currency: 'easyorders-currency',
  ordersSecret: 'easyorders-orders-secret',
  statusSecret: 'easyorders-status-secret',
} as const

const SECTION_IDS = {
  orderSettings: 'easyorders-order-settings-heading',
  secrets: 'easyorders-secrets-heading',
} as const

type Field = keyof typeof FIELD_IDS
type SettingsField = 'phoneCountry' | 'currency'
type SecretField = 'ordersSecret' | 'statusSecret'

const SETTINGS_FIELDS: readonly SettingsField[] = ['phoneCountry', 'currency']
const SECRET_FIELDS: readonly SecretField[] = ['ordersSecret', 'statusSecret']
const SECRET_PATHS: Record<SecretField, string> = {
  ordersSecret: '/orders/',
  statusSecret: '/status/',
}

type FormError =
  | { section: 'orderSettings'; kind: 'required' }
  | { section: 'secrets'; kind: 'required' | 'invalid' }

interface EasyOrdersDetailsStepProps {
  connection: EasyOrdersConnectionDetails
  canManage: boolean
  isSaving: boolean
  /** The last save of each part failed on the server. */
  settingsFailed: boolean
  secretsFailed: boolean
  onSaveSettings: (settings: EasyOrdersOrderSettings) => Promise<boolean>
  onSaveSecrets: (secrets: EasyOrdersWebhookSecrets) => Promise<boolean>
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
 * Step "Store details" of an EasyOrders setup: the three things only this
 * platform needs, on one form with one button. EasyOrders sends amounts
 * without a currency and phone numbers without a country code, and signs
 * what it sends with a secret per webhook. The secret fields are masked and
 * emptied after a save: a stored secret is never shown again, and leaving
 * them empty keeps the ones already stored.
 */
export function EasyOrdersDetailsStep({
  connection,
  canManage,
  isSaving,
  settingsFailed,
  secretsFailed,
  onSaveSettings,
  onSaveSecrets,
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
  const [secrets, setSecrets] = useState<EasyOrdersWebhookSecrets>({
    ordersSecret: '',
    statusSecret: '',
  })
  const [error, setError] = useState<FormError | null>(null)
  const secretsStored = connection.ordersSecretSet && connection.statusSecretSet
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
    setError(null)
  }

  const setSecret = (field: SecretField, value: string) => {
    setSecrets((previous) => ({ ...previous, [field]: value }))
    setError(null)
  }

  const fail = (next: FormError, field: Field) => {
    setError(next)
    document.getElementById(FIELD_IDS[field])?.focus()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return

    const emptySetting = SETTINGS_FIELDS.find((field) => !settings[field])
    if (emptySetting) {
      fail({ section: 'orderSettings', kind: 'required' }, emptySetting)
      return
    }

    const typed = {
      ordersSecret: secrets.ordersSecret.trim(),
      statusSecret: secrets.statusSecret.trim(),
    }
    // Stored secrets stay unless the merchant starts typing new ones.
    const replacing =
      !secretsStored || SECRET_FIELDS.some((field) => typed[field])
    if (replacing) {
      const emptySecret = SECRET_FIELDS.find((field) => !typed[field])
      const invalidSecret = SECRET_FIELDS.find(
        (field) => !isValidWebhookSecret(typed[field])
      )
      const wrong = emptySecret ?? invalidSecret
      if (wrong) {
        fail(
          { section: 'secrets', kind: emptySecret ? 'required' : 'invalid' },
          wrong
        )
        return
      }
    }
    setError(null)

    const settingsChanged =
      settings.currency !== connection.currency ||
      settings.phoneCountry !== connection.phoneCountry
    if (settingsChanged && !(await onSaveSettings(settings))) return
    if (replacing) {
      if (!(await onSaveSecrets(typed))) return
      setSecrets({ ordersSecret: '', statusSecret: '' })
    }
    onContinue()
  }

  const sectionError = (section: FormError['section'], failed: boolean) => {
    const kind = error?.section === section ? error.kind : null
    const message =
      section === 'orderSettings'
        ? kind
          ? tSettings(`errors.${kind}`)
          : failed
            ? tSettings('errors.failed')
            : null
        : kind
          ? tSecrets(`errors.${kind}`)
          : failed
            ? tSecrets('errors.failed')
            : null
    return (
      message && (
        <Notice tone="destructive" icon={<AlertCircle aria-hidden="true" />}>
          {message}
        </Notice>
      )
    )
  }

  const settingsInvalid = error?.section === 'orderSettings'
  const secretsInvalid = error?.section === 'secrets'

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
                  aria-invalid={
                    settingsInvalid && !settings[name] ? true : undefined
                  }
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
          {sectionError('orderSettings', settingsFailed)}
        </section>

        <section
          aria-labelledby={SECTION_IDS.secrets}
          className="border-line space-y-4 border-t pt-6"
        >
          <h2 id={SECTION_IDS.secrets} className="text-ink text-lg font-bold">
            {secretsStored ? tSecrets('replaceTitle') : tSecrets('title')}
          </h2>
          <p className="text-ink-muted text-sm">
            {tSecrets.rich('body', {
              hint: () => (
                <bdi
                  dir="ltr"
                  className="text-ink font-mono text-xs font-semibold"
                >
                  …{connection.webhookUrlHint ?? ''}
                </bdi>
              ),
            })}
          </p>
          <p className="text-ink-muted text-sm">
            {secretsStored ? t('secretsKept') : tSecrets('warning')}
          </p>
          {SECRET_FIELDS.map((name) => (
            <div key={name} className="space-y-2">
              <Label
                htmlFor={FIELD_IDS[name]}
                className="text-ink text-sm font-semibold"
              >
                {tSecrets(`${name}.label`)}
              </Label>
              <Input
                id={FIELD_IDS[name]}
                name={name}
                type="password"
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
                value={secrets[name]}
                disabled={disabled}
                onChange={(event) => setSecret(name, event.target.value)}
                aria-describedby={`${FIELD_IDS[name]}-hint`}
                aria-invalid={secretsInvalid}
                className="rounded-control bg-card h-12 text-start"
              />
              <p
                id={`${FIELD_IDS[name]}-hint`}
                className="text-ink-muted text-sm"
              >
                {tSecrets.rich(`${name}.hint`, {
                  path: () => (
                    <bdi dir="ltr" className="font-mono text-xs">
                      {SECRET_PATHS[name]}
                    </bdi>
                  ),
                })}
              </p>
            </div>
          ))}
          {sectionError('secrets', secretsFailed)}
          <p className="text-ink-muted text-sm">{tSecrets('duplicates')}</p>
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
