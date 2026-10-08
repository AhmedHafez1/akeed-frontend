'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { cn } from '@/shared/lib/utils'
import { Button, Input, Label } from '@/shared/ui'
import { WhatsAppPhonePreview } from '@/shared/ui/whatsapp'
import { platformLabel } from './AdminStoreUi'
import { TemplateActionsPanel } from './TemplateActionsPanel'
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
import type {
  RenderedTemplateMessage,
  TemplateDetailResponse,
} from './admin-templates.model'
import { useAdminTemplate } from './useAdminTemplates'

type Translate = ReturnType<typeof useTranslations>

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm">
      <h2 className="text-foreground text-base font-semibold">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}

const cell = 'p-3 text-start align-top'
const head = 'p-3 text-start text-xs font-medium whitespace-nowrap'

function Notice({
  tone,
  title,
  children,
}: {
  tone: 'danger' | 'warning' | 'info'
  title: string
  children?: React.ReactNode
}) {
  const Icon = tone === 'info' ? Info : AlertTriangle
  return (
    <div
      role={tone === 'info' ? 'status' : 'alert'}
      className={cn(
        'flex gap-3 rounded-xl border p-4 text-sm',
        tone === 'danger' &&
          'border-destructive-border bg-destructive-subtle text-destructive-subtle-foreground',
        tone === 'warning' &&
          'border-warning-border bg-warning-subtle text-warning-subtle-foreground',
        tone === 'info' &&
          'border-info-border bg-info-subtle text-info-subtle-foreground'
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children}
      </div>
    </div>
  )
}

/** What staff must know before trusting this template: sendable and drift. */
function TemplateWarnings({ detail }: { detail: TemplateDetailResponse }) {
  const t = useTranslations('adminTemplates')
  const { label } = useTemplateFormat()
  const { template, drift } = detail
  const direction = template.language === 'ar' ? 'rtl' : 'ltr'

  return (
    <div className="space-y-3">
      {drift.state === 'missing' ? (
        <Notice tone="danger" title={t('warnings.missingTitle')}>
          <p className="mt-1">{t('warnings.missingBody')}</p>
        </Notice>
      ) : !template.is_active ? (
        <Notice tone="warning" title={t('warnings.inactiveTitle')}>
          <p className="mt-1">{t('warnings.inactiveBody')}</p>
        </Notice>
      ) : !template.sendable ? (
        <Notice tone="danger" title={t('warnings.notSendableTitle')}>
          <p className="mt-1">
            {t('warnings.notSendableBody', {
              status: label('status', template.review_status ?? 'not_synced'),
            })}
          </p>
        </Notice>
      ) : null}
      {template.pending_category && (
        <Notice tone="warning" title={t('warnings.categoryTitle')}>
          <p className="mt-1">
            {t('warnings.categoryBody', {
              category: label('category', template.pending_category),
            })}
          </p>
        </Notice>
      )}
      {drift.state === 'not_synced' && (
        <Notice tone="info" title={t('warnings.notSyncedTitle')}>
          <p className="mt-1">{t('warnings.notSyncedBody')}</p>
        </Notice>
      )}
      {drift.state === 'unreadable' && (
        <Notice tone="warning" title={t('warnings.unreadableTitle')}>
          <p className="mt-1">{t('warnings.unreadableBody')}</p>
        </Notice>
      )}
      {drift.state === 'drift' && (
        <Notice
          tone={drift.severity === 'send' ? 'danger' : 'warning'}
          title={
            drift.severity === 'send'
              ? t('warnings.driftSendTitle')
              : t('warnings.driftPreviewTitle')
          }
        >
          <p className="mt-1">
            {drift.severity === 'send'
              ? t('warnings.driftSendBody')
              : t('warnings.driftPreviewBody')}
          </p>
          <ul className="mt-3 space-y-3">
            {drift.differences.map((difference) => (
              <li
                key={difference.kind}
                className="border-border bg-card text-foreground rounded-lg border p-3"
              >
                <p className="font-medium">
                  {label('drift.kind', difference.kind)}
                </p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(['registered', 'provider'] as const).map((side) => (
                    <div key={side} className="min-w-0">
                      <dt className="text-muted-foreground text-xs">
                        {t(`drift.${side}`)}
                      </dt>
                      <dd
                        className="mt-1 text-sm break-words whitespace-pre-wrap"
                        dir={direction}
                      >
                        {difference[side] || t('none')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </Notice>
      )}
    </div>
  )
}

function MessagePreview({
  message,
  t,
}: {
  message: RenderedTemplateMessage
  t: Translate
}) {
  return (
    <WhatsAppPhonePreview
      senderName={t('preview.sender')}
      senderStatus={t('preview.senderStatus')}
      avatarAlt={t('preview.avatarAlt')}
      dayLabel={t('preview.day')}
      timeLabel={t('preview.time')}
      paragraphs={message.paragraphs}
      buttons={message.buttons.map((button, index) => ({
        label: button.label,
        tone: index === 0 ? 'confirm' : 'cancel',
      }))}
      messageDir={message.direction}
    />
  )
}

function TestSendForm({
  pending,
  sent,
  onSend,
}: {
  pending: boolean
  sent: boolean
  onSend: (phone: string) => void
}) {
  const t = useTranslations('adminTemplates')
  const [phone, setPhone] = useState('')
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (phone.trim()) onSend(phone.trim())
      }}
    >
      <div className="min-w-0">
        <Label
          htmlFor="template-test-phone"
          className="text-foreground/70 mb-1.5 block text-xs font-medium"
        >
          {t('test.phone')}
        </Label>
        <Input
          id="template-test-phone"
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="off"
          className="h-10 w-56"
          placeholder="+201001234567"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending || !phone.trim()}>
        {pending ? t('test.sending') : t('test.send')}
      </Button>
      {sent && (
        <p role="status" className="text-success-subtle-foreground text-sm">
          {t('test.sent')}
        </p>
      )}
    </form>
  )
}

export function TemplateDetailAdminPage({
  templateKey,
}: {
  templateKey: string
}) {
  const t = useTranslations('adminTemplates')
  const { isRTL, locale } = useLocaleInfo()
  const state = useAdminTemplate(templateKey)
  const format = useTemplateFormat()
  const detail = state.detail
  const listHref = `/${locale}/admin/templates`

  return (
    <section
      className="space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-busy={state.loading}
    >
      <Link
        href={listHref}
        className="text-primary focus-visible:ring-ring inline-flex items-center gap-1.5 rounded text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t('detail.back')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-primary text-xs font-semibold uppercase">
            {t('eyebrow')}
          </p>
          <h1
            className="text-foreground mt-2 font-mono text-xl font-semibold break-all sm:text-2xl"
            dir="ltr"
          >
            {templateKey}
          </h1>
          {detail && (
            <>
              <p
                className="text-muted-foreground mt-1 font-mono text-sm break-all"
                dir="ltr"
              >
                {detail.template.template_name} [{detail.template.language_code}
                ]
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TemplateStatusBadge status={detail.template.review_status} />
                <TemplateDriftBadge drift={detail.drift} />
              </div>
              <TemplateFlags template={detail.template} />
            </>
          )}
        </div>
        <Button
          variant="outline"
          onClick={state.refresh}
          disabled={state.loading}
        >
          {t('refresh')}
        </Button>
      </header>

      {state.error &&
        (state.error.status === 404 ? (
          <Notice tone="warning" title={t('detail.notFoundTitle')}>
            <p className="mt-1">{t('detail.notFoundBody')}</p>
          </Notice>
        ) : (
          <TemplateErrorNotice
            error={state.error}
            onRetry={detail ? undefined : state.refresh}
          />
        ))}
      {!detail && state.loading && (
        <p role="status" className="text-muted-foreground p-8 text-center">
          {t('loading')}
        </p>
      )}

      {detail && (
        <>
          <TemplateWarnings detail={detail} />
          <TemplateActionsPanel
            templateKey={templateKey}
            language={detail.template.language}
            operator={detail.operations.enabled && detail.operations.operator}
            onChanged={state.refresh}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <Panel
              title={t('preview.title')}
              description={
                detail.message
                  ? t('preview.fromMeta')
                  : t('preview.fromRegistry')
              }
            >
              <MessagePreview
                message={detail.message ?? detail.registered_preview}
                t={t}
              />
            </Panel>

            <div className="space-y-6">
              <Panel title={t('facts.title')}>
                <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  {(
                    [
                      [
                        'purpose',
                        format.label('purpose', detail.template.purpose),
                      ],
                      [
                        'language',
                        format.label('language', detail.template.language),
                      ],
                      [
                        'format',
                        format.label(
                          'parameterFormat',
                          detail.template.parameter_format
                        ),
                      ],
                      [
                        'category',
                        <TemplateCategoryLabel
                          key="category"
                          category={detail.template.category}
                          pending={detail.template.pending_category}
                        />,
                      ],
                      [
                        'quality',
                        <TemplateQualityBadge
                          key="quality"
                          quality={detail.template.quality}
                        />,
                      ],
                      [
                        'lastSync',
                        format.dateTime(detail.template.last_synced_at),
                      ],
                      [
                        'textChanged',
                        format.dateTime(detail.template.text_changed_at),
                      ],
                    ] as const
                  ).map(([key, value]) => (
                    <div key={key} className="min-w-0">
                      <dt className="text-muted-foreground text-xs">
                        {t(`facts.${key}`)}
                      </dt>
                      <dd className="text-foreground mt-1">{value}</dd>
                    </div>
                  ))}
                  <div className="min-w-0">
                    <dt className="text-muted-foreground text-xs">
                      {t('facts.metaId')}
                    </dt>
                    <dd
                      className="text-foreground mt-1 font-mono text-xs break-all"
                      dir="ltr"
                    >
                      {detail.template.provider_template_id ?? t('none')}
                    </dd>
                  </div>
                </dl>
              </Panel>

              <Panel
                title={t('variables.title')}
                description={t('variables.description')}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-foreground/70">
                      <tr>
                        {(['variable', 'parameter', 'sample'] as const).map(
                          (column) => (
                            <th key={column} scope="col" className={head}>
                              {t(`variables.${column}`)}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.variables.map((row) => (
                        <tr
                          key={row.parameter}
                          className="border-border border-t"
                        >
                          <th scope="row" className={cn(cell, 'font-normal')}>
                            {format.label('variables.names', row.variable)}
                          </th>
                          <td className={cn(cell, 'font-mono')} dir="ltr">
                            {row.parameter}
                          </td>
                          <td
                            className={cell}
                            dir={
                              detail.template.language === 'ar' ? 'rtl' : 'ltr'
                            }
                          >
                            {row.sample}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </div>

          <Panel title={t('metrics.title')} description={t('metrics.hint')}>
            <TemplateRangeFields
              range={state.range}
              valid={state.rangeValid}
              onChange={state.setRange}
            />
            {detail.metrics_by_purpose.length === 0 ? (
              <p className="text-muted-foreground mt-4 text-sm">
                {t('metrics.empty')}
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-foreground/70">
                    <tr>
                      {(
                        [
                          'purpose',
                          'sends',
                          'replies',
                          'confirmed',
                          'canceled',
                          'noReply',
                          'confirmationRate',
                        ] as const
                      ).map((column) => (
                        <th key={column} scope="col" className={head}>
                          {t(`metrics.${column}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.metrics_by_purpose.map((row) => (
                      <tr key={row.purpose} className="border-border border-t">
                        <th scope="row" className={cn(cell, 'font-normal')}>
                          {format.label('sendPurpose', row.purpose)}
                        </th>
                        {[
                          row.sends,
                          row.replies,
                          row.confirmed,
                          row.canceled,
                          row.no_reply,
                        ].map((value, index) => (
                          <td key={index} className={cn(cell, 'tabular-nums')}>
                            {format.count(value)}
                          </td>
                        ))}
                        <td className={cn(cell, 'tabular-nums')}>
                          {format.rate(row.confirmation_rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            title={t('stores.title', { count: detail.stores.total })}
            description={
              detail.stores.total > detail.stores.shown.length
                ? t('stores.truncated', { shown: detail.stores.shown.length })
                : undefined
            }
          >
            {detail.stores.shown.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t('stores.empty')}
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {detail.stores.shown.map((store) => (
                  <li
                    key={store.integration_id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/${locale}/admin/stores/${store.integration_id}`}
                        className="text-primary focus-visible:ring-ring rounded font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
                      >
                        {store.store_name ?? t('stores.unnamed')}
                      </Link>
                      {store.domain && (
                        <p
                          className="text-muted-foreground font-mono text-xs break-all"
                          dir="ltr"
                        >
                          {store.domain}
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {platformLabel(store.platform)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title={t('history.title')}
            description={t('history.description')}
          >
            <h3 className="text-foreground text-sm font-medium">
              {t('history.events')}
            </h3>
            {detail.history.events.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">
                {t('history.noEvents')}
              </p>
            ) : (
              <ul className="divide-border mt-2 divide-y text-sm">
                {detail.history.events.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <span>
                      {format.label('history.field', event.field)}
                      {': '}
                      <span className="font-medium">
                        {Object.values(event.value)
                          .filter((value): value is string => !!value)
                          .map((value) =>
                            format.label(
                              event.field === 'status'
                                ? 'status'
                                : event.field === 'quality'
                                  ? 'quality'
                                  : 'category',
                              value
                            )
                          )
                          .join(' → ') || t('none')}
                      </span>
                      <span className="text-muted-foreground">
                        {' · '}
                        {format.label('history.outcome', event.outcome)}
                      </span>
                    </span>
                    <time
                      className="text-muted-foreground text-xs"
                      dateTime={event.occurred_at}
                    >
                      {format.dateTime(event.occurred_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
            <h3 className="text-foreground mt-5 text-sm font-medium">
              {t('history.syncs')}
            </h3>
            {detail.history.sync_runs.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">
                {t('history.noSyncs')}
              </p>
            ) : (
              <ul className="divide-border mt-2 divide-y text-sm">
                {detail.history.sync_runs.map((run) => (
                  <li
                    key={run.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <span>
                      {format.label('sync.trigger', run.trigger)}
                      {' · '}
                      <span className="font-medium">
                        {run.status === 'failed'
                          ? t('sync.failed', {
                              reason: format.label(
                                'sync.errorCodes',
                                run.error_code ?? 'unknown'
                              ),
                            })
                          : run.missing
                            ? t('history.runMissing')
                            : format.label('sync.status', run.status)}
                      </span>
                    </span>
                    <time
                      className="text-muted-foreground text-xs"
                      dateTime={run.finished_at ?? run.started_at}
                    >
                      {format.dateTime(run.finished_at ?? run.started_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {detail.operations.test_send_available && (
            <Panel title={t('test.title')} description={t('test.description')}>
              {detail.template.sendable ? (
                <TestSendForm
                  pending={state.test.pending}
                  sent={state.test.result === true}
                  onSend={state.sendTest}
                />
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t('test.notSendable')}
                </p>
              )}
              {state.test.error && (
                <TemplateErrorNotice
                  error={state.test.error}
                  className="mt-3"
                />
              )}
            </Panel>
          )}
        </>
      )}
    </section>
  )
}
