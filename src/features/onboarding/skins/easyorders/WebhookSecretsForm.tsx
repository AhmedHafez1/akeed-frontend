'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Input, Label, LoadingButton } from '@/shared/ui'
import {
  isValidWebhookSecret,
  type EasyOrdersWebhookSecrets,
} from './easyOrders.types'

const FIELD_IDS = {
  ordersSecret: 'easyorders-orders-secret',
  statusSecret: 'easyorders-status-secret',
} as const

type SecretField = keyof typeof FIELD_IDS
type FormError = 'required' | 'invalid' | 'failed'

interface WebhookSecretsFormProps {
  /** Last characters of the webhook addresses, to find the rows in EasyOrders. */
  webhookUrlHint: string
  /** Both secrets are stored already; the form then replaces them. */
  alreadySet: boolean
  canManage: boolean
  isSaving: boolean
  saved: boolean
  failed: boolean
  onSave: (secrets: EasyOrdersWebhookSecrets) => Promise<boolean>
}

/**
 * The merchant copies each webhook's secret from EasyOrders. The fields are
 * masked and emptied after a save: a stored secret is never shown again.
 */
export function WebhookSecretsForm({
  webhookUrlHint,
  alreadySet,
  canManage,
  isSaving,
  saved,
  failed,
  onSave,
}: WebhookSecretsFormProps) {
  const t = useTranslations('easyOrdersConnect.success.secrets')
  const [values, setValues] = useState<EasyOrdersWebhookSecrets>({
    ordersSecret: '',
    statusSecret: '',
  })
  const [localError, setLocalError] = useState<FormError | null>(null)
  const error: FormError | null = localError ?? (failed ? 'failed' : null)

  const setValue = (field: SecretField, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))
    setLocalError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const secrets = {
      ordersSecret: values.ordersSecret.trim(),
      statusSecret: values.statusSecret.trim(),
    }
    const firstEmpty = (['ordersSecret', 'statusSecret'] as const).find(
      (field) => !secrets[field]
    )
    const firstInvalid = (['ordersSecret', 'statusSecret'] as const).find(
      (field) => !isValidWebhookSecret(secrets[field])
    )
    if (firstEmpty || firstInvalid) {
      setLocalError(firstEmpty ? 'required' : 'invalid')
      document.getElementById(FIELD_IDS[firstEmpty ?? firstInvalid!])?.focus()
      return
    }
    setLocalError(null)
    if (await onSave(secrets)) {
      setValues({ ordersSecret: '', statusSecret: '' })
    }
  }

  const field = (name: SecretField, pathHint: string) => (
    <div className="space-y-2">
      <Label
        htmlFor={FIELD_IDS[name]}
        className="text-ink text-sm font-semibold"
      >
        {t(`${name}.label`)}
      </Label>
      <Input
        id={FIELD_IDS[name]}
        name={name}
        type="password"
        dir="ltr"
        autoComplete="off"
        spellCheck={false}
        value={values[name]}
        disabled={!canManage || isSaving}
        onChange={(event) => setValue(name, event.target.value)}
        aria-describedby={`${FIELD_IDS[name]}-hint`}
        aria-invalid={Boolean(error && error !== 'failed')}
        className="rounded-control bg-card h-12 text-start"
      />
      <p id={`${FIELD_IDS[name]}-hint`} className="text-ink-muted text-sm">
        {t.rich(`${name}.hint`, {
          path: () => (
            <bdi dir="ltr" className="font-mono text-xs">
              {pathHint}
            </bdi>
          ),
        })}
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
        <h2 className="text-ink text-lg font-bold">
          {alreadySet ? t('replaceTitle') : t('title')}
        </h2>
        <p className="text-ink-muted text-sm">
          {t.rich('body', {
            hint: () => (
              <bdi
                dir="ltr"
                className="text-ink font-mono text-xs font-semibold"
              >
                …{webhookUrlHint}
              </bdi>
            ),
          })}
        </p>
        {!alreadySet && (
          <p className="border-warning-border bg-warning-subtle text-warning-subtle-foreground rounded-panel border p-3 text-sm">
            {t('warning')}
          </p>
        )}
      </div>

      {field('ordersSecret', '/orders/')}
      {field('statusSecret', '/status/')}

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
        {alreadySet ? t('replace') : t('save')}
      </LoadingButton>
    </form>
  )
}
