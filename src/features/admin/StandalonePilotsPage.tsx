'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { downloadPilotReport, useStandalonePilots } from './useStandalonePilots'
import type { PilotCounts, PilotRow } from './standalone-pilot.model'

const countKeys: (keyof PilotCounts)[] = [
  'eligible',
  'alreadyEntitled',
  'skipped',
  'existingSource',
  'ambiguous',
]

export function StandalonePilotsPage() {
  const t = useTranslations('adminPilots')
  const { isRTL, locale } = useLocaleInfo()
  const state = useStandalonePilots()
  const locked = !!state.busy || state.loading
  const retryApply = state.report?.results.some(
    (result) => result.outcome === 'failed'
  )
  const completed = !!state.report && !retryApply
  const formatTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  const planLabel = (plan: string | null) => {
    if (!plan) return t('noPlan')
    if (['starter', 'basic', 'pro', 'business'].includes(plan))
      return t(`plans.${plan}`)
    return t('plans.unknown')
  }
  const entitlementLabel = (row: PilotRow) => {
    if (!row.source?.isActive) return t('sourceStatus.inactive')
    if (row.source.billingStatus === 'not_required')
      return t('sourceStatus.manual')
    return t('sourceStatus.review')
  }
  const renderSource = (row: PilotRow) =>
    row.source ? (
      <>
        <div className="font-mono text-xs break-all" dir="ltr">
          {row.source.identity}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {planLabel(row.source.billingPlanId)} · {entitlementLabel(row)}
        </div>
      </>
    ) : (
      <span className="text-slate-500">{t('noSource')}</span>
    )

  return (
    <section
      className="space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-busy={locked}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {t('description')}
          </p>
        </div>
        <Button variant="outline" onClick={state.refresh} disabled={locked}>
          {t('refresh')}
        </Button>
      </header>
      {state.page && !state.page.activationEnabled && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
          {t('disabled')}
        </p>
      )}
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          <p>
            {state.error.status === 403
              ? t('accessDenied')
              : state.error.status === 400
                ? t('invalidRequest')
                : t('requestFailed')}
          </p>
          {state.error.requestId && (
            <p className="mt-2 font-mono" dir="ltr">
              {state.error.requestId}
            </p>
          )}
          {!state.page && (
            <Button className="mt-3" variant="outline" onClick={state.refresh}>
              {t('retry')}
            </Button>
          )}
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <p className="me-auto text-sm" aria-live="polite">
            {t('selected', { count: state.selected.length })}
          </p>
          <Button
            variant="ghost"
            disabled={locked || !state.selected.length}
            onClick={state.clearSelection}
          >
            {t('clear')}
          </Button>
          <Button
            disabled={locked || !state.selected.length}
            onClick={state.createPreview}
          >
            {state.busy === 'preview' ? t('previewing') : t('preview')}
          </Button>
        </div>
        {state.loading ? (
          <p role="status" className="p-8 text-center text-slate-500">
            {t('loading')}
          </p>
        ) : state.page?.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th scope="col" className="p-4 text-start">
                    {t('select')}
                  </th>
                  <th scope="col" className="p-4 text-start">
                    {t('organization')}
                  </th>
                  <th scope="col" className="p-4 text-start">
                    {t('source')}
                  </th>
                  <th scope="col" className="p-4 text-start">
                    {t('eligibility')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.page.rows.map((row) => (
                  <tr
                    key={row.orgId}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="size-4 accent-emerald-600"
                        aria-label={t('selectOrganization', {
                          name: row.organizationName ?? row.orgId,
                        })}
                        checked={state.selected.includes(row.orgId)}
                        disabled={
                          locked ||
                          (!state.selected.includes(row.orgId) &&
                            state.selected.length >= 50)
                        }
                        onChange={() => state.toggle(row.orgId)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium">
                        {row.organizationName ?? t('missingOrganization')}
                      </div>
                      <div
                        className="mt-1 font-mono text-xs break-all text-slate-500"
                        dir="ltr"
                      >
                        {row.orgId}
                      </div>
                    </td>
                    <td className="p-4">{renderSource(row)}</td>
                    <td className="p-4">
                      <span
                        className={
                          row.status === 'eligible'
                            ? 'font-medium text-emerald-700'
                            : row.status === 'ambiguous'
                              ? 'font-medium text-amber-800'
                              : 'font-medium text-slate-600'
                        }
                      >
                        {t(`statuses.${row.status}`)}
                      </span>
                      <p className="mt-1 max-w-sm text-xs text-slate-500">
                        {t(`reasons.${row.reason}`)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-slate-500">{t('empty')}</p>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <Button
            variant="outline"
            disabled={locked || !state.hasPrevious}
            onClick={state.previous}
          >
            {t('previous')}
          </Button>
          <Button
            variant="outline"
            disabled={locked || !state.page?.nextCursor}
            onClick={state.next}
          >
            {t('next')}
          </Button>
        </div>
      </div>
      {state.preview && (
        <section
          className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5"
          aria-labelledby="pilot-preview-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="pilot-preview-title" className="text-lg font-semibold">
              {t('reviewTitle')}
            </h2>
            <Button
              variant="outline"
              onClick={() => downloadPilotReport(state.preview!)}
            >
              {t('downloadPreview')}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {t('evaluatedAt', { time: formatTime(state.preview.evaluatedAt) })}
          </p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {countKeys.map((key) => (
              <div key={key} className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">{t(`counts.${key}`)}</dt>
                <dd className="mt-1 text-xl font-semibold">
                  {state.preview!.counts[key]}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-slate-500">{t('existingSourceNote')}</p>
          <ul className="divide-y divide-slate-100">
            {state.preview.rows.map((row) => (
              <li className="py-3 text-sm" key={row.orgId}>
                <span className="font-medium">
                  {row.organizationName ?? row.orgId}
                </span>
                <p className="mt-1 text-slate-600">
                  {t(`reasons.${row.reason}`)}
                </p>
                {row.proposed && (
                  <p className="mt-1 text-emerald-800">
                    {t('proposed', { limit: row.proposed.includedLimit })} ·{' '}
                    {row.proposed.billingActivatedAt
                      ? t('keepAnchor', {
                          time: formatTime(row.proposed.billingActivatedAt),
                        })
                      : t('newAnchor')}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <label htmlFor="pilot-reason" className="block text-sm font-medium">
            {t('reason')}
          </label>
          <textarea
            id="pilot-reason"
            value={state.reason}
            onChange={(event) => state.setReason(event.target.value)}
            maxLength={500}
            rows={3}
            disabled={!!state.busy}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            aria-describedby="pilot-reason-help"
          />
          <p id="pilot-reason-help" className="text-xs text-slate-500">
            {t('reasonHelp')}
          </p>
          <Button
            onClick={state.apply}
            disabled={
              locked ||
              completed ||
              !state.page?.activationEnabled ||
              !state.preview.activationEnabled ||
              !state.preview.counts.eligible ||
              !state.reason.trim()
            }
          >
            {state.busy === 'apply'
              ? t('applying')
              : retryApply
                ? t('retryApply')
                : t('apply', { count: state.preview.counts.eligible })}
          </Button>
        </section>
      )}
      {state.report && (
        <section
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t('results')}</h2>
            <Button
              variant="outline"
              onClick={() => downloadPilotReport(state.report!)}
            >
              {t('downloadResults')}
            </Button>
          </div>
          <p className="text-sm text-slate-600">{t('resultHelp')}</p>
          <ul className="divide-y divide-slate-100">
            {state.report.results.map((result) => (
              <li className="py-3 text-sm" key={result.orgId}>
                <span className="font-medium">
                  {state.preview?.rows.find((row) => row.orgId === result.orgId)
                    ?.organizationName ?? result.orgId}
                </span>
                <p className="mt-1">
                  {t(`outcomes.${result.outcome}`)} ·{' '}
                  {t(`reasons.${result.reason}`)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
