'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input } from '@/shared/ui'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { AdminApiError } from './adminApi'
import {
  getBillingSettlements,
  postBillingSettlement,
} from './billingObservabilityApi'
import { formatDateTime } from './standaloneBillingFormat'
import type {
  BillingSettlement,
  BillingSettlementsPage,
} from './billing-observability.model'

interface SettlementDraft {
  providerReportId: string
  periodStart: string
  periodEnd: string
  settledAt: string
  transactionCount: string
  gross: string
  refunds: string
  chargebacks: string
  fees: string
  vat: string
  net: string
  evidence: string
  reason: string
  supersedesId?: string
}

const emptyDraft: SettlementDraft = {
  providerReportId: '',
  periodStart: '',
  periodEnd: '',
  settledAt: '',
  transactionCount: '',
  gross: '',
  refunds: '0.00',
  chargebacks: '0.00',
  fees: '',
  vat: '',
  net: '',
  evidence: '',
  reason: '',
}

function localDateTime(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function decimalToMinor(value: string, signed = false): number | null {
  const normalized = value.trim()
  if (
    !(signed ? /^-?\d+(?:\.\d{1,2})?$/ : /^\d+(?:\.\d{1,2})?$/).test(normalized)
  )
    return null
  const negative = normalized.startsWith('-')
  const [whole, fraction = ''] = normalized.replace(/^-/, '').split('.')
  const minor =
    (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) *
    (negative ? -1 : 1)
  return Number.isSafeInteger(minor) ? minor : null
}

function minorToDecimal(value: number) {
  return (value / 100).toFixed(2)
}

export function StandaloneBillingSettlements({
  canOperate,
}: {
  canOperate: boolean
}) {
  const t = useTranslations('adminBillingObservability.settlements')
  const { locale } = useLocaleInfo()
  const [page, setPage] = useState<BillingSettlementsPage | null>(null)
  const [draft, setDraft] = useState(emptyDraft)
  // One key per draft: resubmitting the same values after a lost response is
  // the same entry, while any edit is a different one.
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [saved, setSaved] = useState(false)

  const replaceDraft = (next: SettlementDraft) => {
    setDraft(next)
    setIdempotencyKey(crypto.randomUUID())
  }

  const [loadFailed, setLoadFailed] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setLoadFailed(false)
    getBillingSettlements()
      .then(setPage)
      .catch((cause: unknown) => {
        console.error('[Admin] Settlement history request failed', cause)
        setLoadFailed(true)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const set = (key: keyof SettlementDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setIdempotencyKey(crypto.randomUUID())
  }

  function correct(report: BillingSettlement) {
    replaceDraft({
      providerReportId: report.providerReportId,
      periodStart: localDateTime(report.periodStart),
      periodEnd: localDateTime(report.periodEnd),
      settledAt: localDateTime(report.settledAt),
      transactionCount: String(report.transactionCount),
      gross: minorToDecimal(report.grossMinor),
      refunds: minorToDecimal(report.refundedMinor),
      chargebacks: minorToDecimal(report.chargebackMinor),
      fees: minorToDecimal(report.feeMinor),
      vat: minorToDecimal(report.vatMinor),
      net: minorToDecimal(report.netMinor),
      evidence: '',
      reason: '',
      supersedesId: report.id,
    })
    setSaved(false)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const amounts = [
      draft.gross,
      draft.refunds,
      draft.chargebacks,
      draft.fees,
      draft.vat,
      draft.net,
    ].map((value, index) => decimalToMinor(value, index === 5))
    if (amounts.some((value) => value === null)) {
      setError(new AdminApiError(t('error'), 400, null))
      return
    }
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await postBillingSettlement(
        {
          providerReportId: draft.providerReportId.trim(),
          supersedesId: draft.supersedesId ?? null,
          periodStart: new Date(draft.periodStart).toISOString(),
          periodEnd: new Date(draft.periodEnd).toISOString(),
          settledAt: new Date(draft.settledAt).toISOString(),
          currency: 'EGP',
          transactionCount: Number(draft.transactionCount),
          grossMinor: amounts[0]!,
          refundedMinor: amounts[1]!,
          chargebackMinor: amounts[2]!,
          feeMinor: amounts[3]!,
          vatMinor: amounts[4]!,
          netMinor: amounts[5]!,
          evidence: draft.evidence.trim(),
          reason: draft.reason.trim(),
        },
        idempotencyKey
      )
      replaceDraft(emptyDraft)
      setSaved(true)
      load()
    } catch (cause) {
      console.error('[Admin] Settlement entry failed', cause)
      setError(
        cause instanceof AdminApiError
          ? cause
          : new AdminApiError('Request failed', 0, null)
      )
    } finally {
      setSaving(false)
    }
  }

  const fields: Array<{
    key: keyof SettlementDraft
    label?: string
    type?: string
    step?: string
  }> = [
    { key: 'providerReportId', label: 'reportId' },
    { key: 'periodStart', type: 'datetime-local' },
    { key: 'periodEnd', type: 'datetime-local' },
    { key: 'settledAt', type: 'datetime-local' },
    { key: 'transactionCount', type: 'number', step: '1' },
    { key: 'gross', type: 'number', step: '0.01' },
    { key: 'refunds', type: 'number', step: '0.01' },
    { key: 'chargebacks', type: 'number', step: '0.01' },
    { key: 'fees', type: 'number', step: '0.01' },
    { key: 'vat', type: 'number', step: '0.01' },
    { key: 'net', type: 'number', step: '0.01' },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            {t('description')}
          </p>
        </div>
        {draft.supersedesId && (
          <Button variant="outline" onClick={() => replaceDraft(emptyDraft)}>
            {t('cancelCorrection')}
          </Button>
        )}
      </div>
      {!canOperate && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
        >
          {t('readOnly')}
        </p>
      )}
      <form onSubmit={submit} className="mt-4">
        <fieldset
          disabled={!canOperate || saving}
          className="min-w-0 space-y-4"
        >
          <p className="text-xs text-slate-500">{t('periodHint')}</p>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {fields.map((field) => (
              <label
                key={field.key}
                className="min-w-0 text-xs font-medium text-slate-600"
              >
                {t(field.label ?? field.key)}
                <Input
                  className="mt-1.5 min-w-0"
                  dir={field.type === 'number' ? 'ltr' : undefined}
                  required
                  min={
                    field.type === 'number' && field.key !== 'net'
                      ? 0
                      : undefined
                  }
                  type={field.type}
                  step={field.step}
                  value={draft[field.key] ?? ''}
                  onChange={(event) => set(field.key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['evidence', 'reason'] as const).map((key) => (
              <label key={key} className="text-xs font-medium text-slate-600">
                {t(key)}
                <Input
                  className="mt-1.5"
                  required
                  maxLength={500}
                  value={draft[key]}
                  onChange={(event) => set(key, event.target.value)}
                />
              </label>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error.status === 403
                ? t('operatorRequired')
                : error.status === 409
                  ? t('conflict')
                  : t('error')}
              {error.requestId && (
                <span className="ms-2 font-mono" dir="ltr">
                  {error.requestId}
                </span>
              )}
            </p>
          )}
          {saved && (
            <p role="status" className="text-sm text-emerald-700">
              {t('saved')}
            </p>
          )}
          <Button type="submit">{saving ? t('saving') : t('save')}</Button>
        </fieldset>
      </form>

      <div className="mt-6 max-h-72 overflow-auto overscroll-contain rounded-xl border border-slate-200">
        {page?.rows.length ? (
          <ul className="divide-y divide-slate-100">
            {page.rows.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center gap-3 p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs break-all" dir="ltr">
                    {report.providerReportId}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('revision', { revision: report.revision })} ·{' '}
                    {report.effective ? t('effective') : t('superseded')} ·{' '}
                    {formatDateTime(report.settledAt, locale)}
                  </p>
                </div>
                {report.effective && canOperate && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => correct(report)}
                  >
                    {t('correct')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p
            role={loadFailed ? 'alert' : undefined}
            className="p-6 text-center text-sm text-slate-500"
          >
            {loading ? t('loading') : loadFailed ? t('loadError') : t('empty')}
          </p>
        )}
      </div>
    </section>
  )
}
