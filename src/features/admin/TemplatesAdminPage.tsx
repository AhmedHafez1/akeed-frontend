'use client'

import Link from 'next/link'
import { MessageSquareText, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Button } from '@/shared/ui'
import { AdminEmptyState, AdminPageHeader, AdminSelect } from './AdminUi'
import {
  TemplateCategoryLabel,
  TemplateDriftBadge,
  TemplateErrorNotice,
  TemplateFlags,
  TemplateQualityBadge,
  TemplateRangeFields,
  TemplateStatusBadge,
  useTemplateFormat,
} from './TemplateAdminUi'
import {
  templateFilterValues,
  templateStatusKey,
  type TemplateFilters,
  type TemplateSyncRun,
} from './admin-templates.model'
import { TemplateDraftsPanel } from './TemplateDraftsPanel'
import { useAdminTemplates } from './useAdminTemplates'

function SyncResult({ run }: { run: TemplateSyncRun }) {
  const t = useTranslations('adminTemplates')
  const { label } = useTemplateFormat()
  if (run.status !== 'succeeded') {
    return (
      <div
        role="alert"
        className="border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground rounded-xl border p-4 text-sm"
      >
        {t('sync.failed', {
          reason: label('sync.errorCodes', run.error_code ?? 'unknown'),
        })}
      </div>
    )
  }
  return (
    <div
      role="status"
      className="border-success-border bg-success-subtle text-success-subtle-foreground rounded-xl border p-4 text-sm"
    >
      <p className="font-medium">{t('sync.done')}</p>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        {(
          [
            ['updated', run.updated_count ?? 0],
            ['unchanged', run.unchanged_count ?? 0],
            ['missing', run.missing_keys.length],
            ['unknownAtMeta', run.unknown_at_provider.length],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="flex gap-1.5">
            <dt>{t(`sync.${key}`)}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {run.missing_keys.length > 0 && (
        <p className="mt-2 font-mono text-xs break-all" dir="ltr">
          {run.missing_keys.join(', ')}
        </p>
      )}
      {run.unknown_at_provider.length > 0 && (
        <p className="mt-2 font-mono text-xs break-all" dir="ltr">
          {run.unknown_at_provider
            .map((entry) => `${entry.template_name} [${entry.language_code}]`)
            .join(', ')}
        </p>
      )}
    </div>
  )
}

export function TemplatesAdminPage() {
  const t = useTranslations('adminTemplates')
  const { isRTL, locale } = useLocaleInfo()
  const state = useAdminTemplates()
  const format = useTemplateFormat()
  const all = state.page?.templates ?? []
  const canSync = !!state.page?.sync.enabled && !!state.page.operations.operator
  const lastRun = state.page?.sync.last_run ?? null

  const filterOptions: Record<keyof TemplateFilters, [string, string][]> = {
    purpose: templateFilterValues(all, (template) => template.purpose).map(
      (value) => [value, format.label('purpose', value)]
    ),
    language: templateFilterValues(all, (template) => template.language).map(
      (value) => [value, format.label('language', value)]
    ),
    status: templateFilterValues(all, (template) =>
      templateStatusKey(template.review_status)
    ).map((value) => [value, format.label('status', value)]),
    active: [
      ['active', t('flags.active')],
      ['inactive', t('flags.inactive')],
    ],
  }

  return (
    <section
      className="space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-busy={state.loading}
    >
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <Button
              variant="outline"
              onClick={state.refresh}
              disabled={state.loading}
            >
              {t('refresh')}
            </Button>
            {canSync && (
              <Button onClick={state.runSync} disabled={state.sync.pending}>
                <RefreshCw className="size-4" aria-hidden="true" />
                {state.sync.pending ? t('sync.running') : t('sync.run')}
              </Button>
            )}
          </>
        }
      />

      {state.page && (
        <p className="text-muted-foreground text-sm">
          {!state.page.sync.enabled
            ? t('sync.disabled')
            : lastRun
              ? t('sync.last', {
                  time: format.dateTime(
                    lastRun.finished_at ?? lastRun.started_at
                  ),
                  status: format.label('sync.status', lastRun.status),
                })
              : t('sync.never')}
        </p>
      )}
      {state.sync.error && <TemplateErrorNotice error={state.sync.error} />}
      {state.sync.result && <SyncResult run={state.sync.result} />}
      {state.error && (
        <TemplateErrorNotice
          error={state.error}
          onRetry={state.page ? undefined : state.refresh}
        />
      )}

      <TemplateDraftsPanel />

      <div className="border-border bg-card rounded-2xl border shadow-sm">
        <div className="border-border space-y-4 border-b p-4">
          <TemplateRangeFields
            range={state.range}
            valid={state.rangeValid}
            onChange={state.setRange}
          />
          <div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
            role="group"
            aria-label={t('filters.label')}
          >
            {(Object.keys(filterOptions) as (keyof TemplateFilters)[]).map(
              (key) => (
                <AdminSelect
                  key={key}
                  label={t(`filters.${key}`)}
                  value={state.filters[key]}
                  onChange={(event) =>
                    state.setFilter(
                      key,
                      event.target.value as TemplateFilters[typeof key]
                    )
                  }
                  options={[
                    { value: '', label: t('filters.all') },
                    ...filterOptions[key].map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                />
              )
            )}
            <div className="flex items-end">
              <Button
                variant="ghost"
                className="w-full"
                onClick={state.resetFilters}
              >
                {t('filters.reset')}
              </Button>
            </div>
          </div>
        </div>

        {!state.page && state.loading ? (
          <p role="status" className="text-muted-foreground p-8 text-center">
            {t('loading')}
          </p>
        ) : !state.page ? null : all.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState
              icon={MessageSquareText}
              title={t('empty.title')}
              description={t('empty.description')}
            />
          </div>
        ) : state.templates.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center">
            {t('empty.filtered')}
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="bg-card w-full text-start text-sm">
              <caption className="sr-only">{t('table.caption')}</caption>
              <thead className="bg-muted/50 text-foreground/70 text-xs">
                <tr>
                  {(
                    [
                      'template',
                      'purpose',
                      'status',
                      'category',
                      'quality',
                      'stores',
                      'sends',
                      'replyRate',
                      'confirmationRate',
                      'lastSync',
                      'drift',
                    ] as const
                  ).map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="p-4 text-start font-medium whitespace-nowrap"
                    >
                      {t(`table.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.templates.map((template) => (
                  <tr
                    key={template.key}
                    className="border-border border-t align-top"
                  >
                    <th scope="row" className="p-4 text-start font-normal">
                      <Link
                        href={`/${locale}/admin/templates/${encodeURIComponent(template.key)}`}
                        className="text-primary focus-visible:ring-ring rounded font-mono text-sm font-medium break-all hover:underline focus-visible:ring-2 focus-visible:outline-none"
                        dir="ltr"
                      >
                        {template.key}
                      </Link>
                      <div
                        className="text-muted-foreground mt-1 font-mono text-xs break-all"
                        dir="ltr"
                      >
                        {template.template_name} [{template.language_code}]
                      </div>
                      <TemplateFlags template={template} />
                    </th>
                    <td className="p-4">
                      <div>{format.label('purpose', template.purpose)}</div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {format.label('language', template.language)}
                      </div>
                    </td>
                    <td className="p-4">
                      <TemplateStatusBadge status={template.review_status} />
                    </td>
                    <td className="p-4">
                      <TemplateCategoryLabel
                        category={template.category}
                        pending={template.pending_category}
                      />
                    </td>
                    <td className="p-4">
                      <TemplateQualityBadge quality={template.quality} />
                    </td>
                    <td className="p-4 tabular-nums">
                      {format.count(template.active_store_count)}
                    </td>
                    <td className="p-4 tabular-nums">
                      {format.count(template.metrics.sends)}
                    </td>
                    <td className="p-4 tabular-nums">
                      {format.rate(template.metrics.reply_rate)}
                    </td>
                    <td className="p-4 tabular-nums">
                      {format.rate(template.metrics.confirmation_rate)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {format.dateTime(template.last_synced_at)}
                    </td>
                    <td className="p-4">
                      <TemplateDriftBadge drift={template.drift} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
