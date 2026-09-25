'use client'

import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import {
  orderCurrencies,
  type OrderCurrency,
} from '@/shared/commerce/orderCommerce'
import { Button, Switch } from '@/shared/ui'
import { ALLOWED_COUNTRIES } from '@/shared/ui/international-phone-input'
import type { OrderImportDateFormat } from '../../api/orderImportsApi'
import {
  countryChange,
  paymentChoice,
  paymentValuesFor,
  showsDateFormat,
  type MappingChecks,
  type MappingForm,
} from '../../domain/mappingForm'
import { selectClasses } from './styles'

/** Regional-indicator letters: the flag the country's code spells. */
function flagOf(country: string): string {
  return String.fromCodePoint(
    ...[...country.toUpperCase()].map(
      (letter) => 0x1f1e6 + letter.charCodeAt(0) - 65
    )
  )
}

interface PanelProps {
  form: MappingForm
  checks: MappingChecks
  disabled: boolean
  onChange: (next: Partial<MappingForm>) => void
}

const panelClasses = 'rounded-card border-border bg-card space-y-4 border p-5'

/** Phone country, default currency and, only when needed, date format (AC4). */
export function ImportSettingsPanel({
  form,
  checks,
  disabled,
  dateFormatError,
  onChange,
}: PanelProps & { dateFormatError: string | null }) {
  const t = useTranslations('orderImport.settings')
  const locale = useLocale()
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: 'region' })
    return ALLOWED_COUNTRIES.map((code) => ({
      code,
      name: names.of(code) ?? code,
    })).sort((a, b) => a.name.localeCompare(b.name, locale))
  }, [locale])

  return (
    <section aria-labelledby="order-import-settings" className={panelClasses}>
      <h3
        id="order-import-settings"
        className="text-foreground text-sm font-semibold"
      >
        {t('title')}
      </h3>

      <div className="space-y-1.5">
        <label
          htmlFor="order-import-country"
          className="text-foreground text-sm font-medium"
        >
          {t('country')}
        </label>
        <div className="relative">
          <select
            id="order-import-country"
            value={form.country}
            disabled={disabled}
            aria-describedby="order-import-country-help"
            onChange={(event) =>
              onChange(countryChange(form, event.target.value))
            }
            className={selectClasses}
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {`${flagOf(country.code)} ${country.name}`}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
          />
        </div>
        <p
          id="order-import-country-help"
          className="text-muted-foreground text-xs"
        >
          {t('countryHelp')}
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="order-import-currency"
          className="text-foreground text-sm font-medium"
        >
          {t('currency')}
        </label>
        <div className="relative">
          <select
            id="order-import-currency"
            value={form.currency}
            disabled={disabled}
            aria-describedby="order-import-currency-help"
            onChange={(event) =>
              onChange({ currency: event.target.value as OrderCurrency })
            }
            className={selectClasses}
          >
            {orderCurrencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
          />
        </div>
        <p
          id="order-import-currency-help"
          className="text-muted-foreground text-xs"
        >
          {t('currencyHelp')}
        </p>
      </div>

      {showsDateFormat(form, checks) && (
        <fieldset
          className="space-y-2"
          aria-describedby="order-import-date-help"
        >
          <legend className="text-foreground text-sm font-medium">
            {t('dateFormat')}
          </legend>
          <p
            id="order-import-date-help"
            className="text-muted-foreground text-xs"
          >
            {t('dateFormatHelp')}
          </p>
          {(['DMY', 'MDY'] as const satisfies OrderImportDateFormat[]).map(
            (format) => (
              <label
                key={format}
                className="border-border has-[:checked]:border-primary has-[:checked]:bg-primary-subtle flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
              >
                <input
                  type="radio"
                  name="order-import-date-format"
                  value={format}
                  checked={form.dateFormat === format}
                  data-mapping-error={
                    (dateFormatError !== null && format === 'DMY') || undefined
                  }
                  disabled={disabled}
                  onChange={() => onChange({ dateFormat: format })}
                  className="accent-primary size-4"
                />
                <span className="text-foreground">{t(format)}</span>
              </label>
            )
          )}
          {dateFormatError && (
            <p role="alert" className="text-destructive text-xs font-medium">
              {dateFormatError}
            </p>
          )}
        </fieldset>
      )}
    </section>
  )
}

/**
 * Each distinct payment value with its count and a COD / Not COD choice,
 * shown only when a payment column is mapped (AC4). Unknown values start
 * unset and must be chosen.
 */
export function PaymentValuesPanel({
  form,
  checks,
  disabled,
  error,
  onChange,
}: PanelProps & { error: string | null }) {
  const t = useTranslations('orderImport.payment')
  if (form.columns.paymentMethod.length === 0) return null
  const payment = paymentValuesFor(form, checks)

  const choose = (normalizedValue: string, cod: boolean) =>
    onChange({
      payment: { ...form.payment, [normalizedValue]: cod ? 'cod' : 'not_cod' },
    })

  return (
    <section aria-labelledby="order-import-payment" className={panelClasses}>
      <div className="space-y-1">
        <h3
          id="order-import-payment"
          className="text-foreground text-sm font-semibold"
        >
          {t('title')}
        </h3>
        <p className="text-muted-foreground text-xs">{t('description')}</p>
      </div>
      {!payment ? (
        <p className="text-muted-foreground text-sm">{t('recheck')}</p>
      ) : (
        <ul className="space-y-3">
          {payment.values.map((entry) => {
            const choice = paymentChoice(
              form,
              entry.normalizedValue,
              entry.classification
            )
            return (
              <li
                key={entry.normalizedValue}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="text-foreground min-w-0 text-sm">
                  <bdi>{entry.value}</bdi>{' '}
                  <span className="text-muted-foreground tabular-nums">
                    ({entry.count})
                  </span>
                </span>
                {choice === null ? (
                  <span
                    role="group"
                    aria-label={t('choose', { value: entry.value })}
                    className="flex gap-1.5"
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={disabled}
                      data-mapping-error={error !== null || undefined}
                      onClick={() => choose(entry.normalizedValue, true)}
                    >
                      {t('cod')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={disabled}
                      onClick={() => choose(entry.normalizedValue, false)}
                    >
                      {t('notCod')}
                    </Button>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="text-muted-foreground w-16 text-end text-xs font-medium"
                    >
                      {choice === 'cod' ? t('cod') : t('notCod')}
                    </span>
                    <Switch
                      checked={choice === 'cod'}
                      disabled={disabled}
                      label={t('toggle', { value: entry.value })}
                      onChange={(cod) => choose(entry.normalizedValue, cod)}
                    />
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {payment && payment.blankCount > 0 && (
        <p className="text-muted-foreground text-xs">
          {t('blank', { count: payment.blankCount })}
        </p>
      )}
      {payment?.truncated && (
        <p className="text-muted-foreground text-xs">{t('truncated')}</p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      )}
    </section>
  )
}
