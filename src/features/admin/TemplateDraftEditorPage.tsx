'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import { Badge, Button } from '@/shared/ui'
import type { AdminApiError } from './adminApi'
import {
  TemplateErrorNotice,
  TemplateStatusBadge,
  useTemplateFormat,
} from './TemplateAdminUi'
import { TemplateDraftForm } from './TemplateDraftForm'
import type { TemplateDraftFormMode } from './TemplateDraftForm'
import {
  TemplateConfirmDialog,
  TemplateEnvironment,
  TemplateNotice,
  TemplateWriteAccess,
} from './TemplateWriteUi'
import {
  createTemplateDraft,
  discardTemplateDraft,
  editTemplateText,
  reconcileTemplateDraft,
  submitTemplateDraft,
  updateTemplateDraft,
} from './adminTemplateDraftsApi'
import {
  draftStateTone,
  draftToForm,
  emptyDraftForm,
  type TemplateAuthoringContext,
  type TemplateDraft,
  type TemplateDraftForm as DraftForm,
  type TemplateImpact,
  type TemplateSubmitResult,
} from './admin-template-drafts.model'
import type { TemplateReviewStatus } from './admin-templates.model'
import {
  useDraftCheck,
  useTemplateAction,
  useTemplateDraft,
  useTemplateDrafts,
  useTemplateImpact,
} from './useAdminTemplateDrafts'

type Dialog = 'submit' | 'discard' | 'edit' | null

/** The provider's reason, when the refusal carried one. */
function reasonOf(error: AdminApiError | null): string | null {
  const reason = error?.details?.reason
  return typeof reason === 'string' ? reason : null
}

function EditorShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const t = useTranslations('adminTemplates')
  const { isRTL, locale } = useLocaleInfo()
  return (
    <section className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Link
        href={`/${locale}/admin/templates`}
        className="text-primary focus-visible:ring-ring inline-flex items-center gap-1.5 rounded text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t('detail.back')}
      </Link>
      <header>
        <p className="text-primary text-xs font-semibold uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="text-foreground mt-2 text-xl font-semibold sm:text-2xl">
          {title}
        </h1>
      </header>
      {children}
    </section>
  )
}

/** What a submit means, stated before anything is sent to Meta. */
function SubmitFacts({
  context,
  templateName,
  languageCode,
}: {
  context: TemplateAuthoringContext
  templateName: string
  languageCode: string
}) {
  const t = useTranslations('adminTemplates.submit')
  return (
    <>
      <p className="font-mono text-xs break-all" dir="ltr">
        {templateName} [{languageCode}]
      </p>
      <TemplateEnvironment environment={context.environment} />
      <ul className="list-disc space-y-1.5 ps-5">
        <li>{t('reviewTime', { hours: context.options.review_max_hours })}</li>
        <li>{t('categoryRisk')}</li>
        <li>{t('notSendable')}</li>
        <li>{t('nameFixed')}</li>
      </ul>
    </>
  )
}

function DraftEditor({
  context,
  draft,
  impact,
  onChanged,
}: {
  context: TemplateAuthoringContext
  draft: TemplateDraft | null
  impact: TemplateImpact | null
  onChanged: () => void
}) {
  const t = useTranslations('adminTemplates.editor')
  const ts = useTranslations('adminTemplates.submit')
  const format = useTemplateFormat()
  const router = useRouter()
  const { locale } = useLocaleInfo()
  const operator = context.operations.enabled && context.operations.operator
  const [form, setForm] = useState<DraftForm>(() =>
    draft ? draftToForm(draft) : emptyDraftForm(context)
  )
  const [savedForm, setSavedForm] = useState<DraftForm | null>(() =>
    draft ? draftToForm(draft) : null
  )
  const [dialog, setDialog] = useState<Dialog>(null)
  const [editing, setEditing] = useState(false)
  const save = useTemplateAction<{ draft: TemplateDraft }>('Draft save failed')
  const submit = useTemplateAction<TemplateSubmitResult>('Draft submit failed')
  const reconcile = useTemplateAction<TemplateSubmitResult>(
    'Draft check at the provider failed'
  )
  const discard = useTemplateAction<{ discarded: true }>('Draft discard failed')
  const edit = useTemplateAction<{ key: string }>('Template edit failed')

  const state = draft?.state ?? 'draft'
  const mode: TemplateDraftFormMode = !operator
    ? 'readonly'
    : !draft
      ? 'new'
      : state === 'draft'
        ? 'draft'
        : state === 'submitted' && editing
          ? 'text'
          : 'readonly'
  const live = useDraftCheck(form, {
    enabled: mode !== 'readonly',
    draftId: draft?.id,
  })
  const validation = live.check?.validation ?? draft?.validation ?? null
  const templateName = live.check?.template_name ?? draft?.template_name ?? null
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm)
  const busy =
    save.pending || submit.pending || reconcile.pending || discard.pending

  async function saveDraft() {
    const saved = await save.run(() =>
      draft ? updateTemplateDraft(draft.id, form) : createTemplateDraft(form)
    )
    if (!saved) return
    setSavedForm(draftToForm(saved.draft))
    if (!draft)
      router.replace(`/${locale}/admin/templates/drafts/${saved.draft.id}`)
  }

  async function submitDraft() {
    if (!draft) return
    await submit.run(() => submitTemplateDraft(draft.id))
  }

  async function discardDraft() {
    if (!draft) return
    const result = await discard.run(() => discardTemplateDraft(draft.id))
    if (result) router.replace(`/${locale}/admin/templates`)
  }

  async function sendEdit() {
    if (!draft?.template_key) return
    await edit.run(() => editTemplateText(draft.template_key!, form))
  }

  const submitReason = reasonOf(submit.error)
  const editReason = reasonOf(edit.error)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={draftStateTone(state)}>
          {format.label('draftState', state)}
        </Badge>
        {draft?.template_key && (
          <Link
            href={`/${locale}/admin/templates/${encodeURIComponent(draft.template_key)}`}
            className="text-primary focus-visible:ring-ring rounded font-mono text-sm font-medium break-all hover:underline focus-visible:ring-2 focus-visible:outline-none"
            dir="ltr"
          >
            {draft.template_key}
          </Link>
        )}
      </div>
      <TemplateEnvironment environment={context.environment} />
      <TemplateWriteAccess operations={context.operations} />

      {state === 'submit_unknown' && (
        <TemplateNotice tone="danger" title={t('unknown.title')}>
          <p className="mt-1">{t('unknown.body')}</p>
          {operator && (
            <Button
              className="mt-3"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void reconcile
                  .run(() => reconcileTemplateDraft(draft!.id))
                  .then((result) => result && onChanged())
              }
            >
              {reconcile.pending ? t('unknown.checking') : t('unknown.check')}
            </Button>
          )}
        </TemplateNotice>
      )}
      {state === 'submitting' && (
        <TemplateNotice tone="warning" title={t('submitting')} />
      )}
      {reconcile.error && <TemplateErrorNotice error={reconcile.error} />}
      {reconcile.result && (
        <TemplateNotice
          tone="info"
          title={t(`outcome.${reconcile.result.outcome}`)}
        />
      )}
      {draft?.last_error_code && state === 'draft' && (
        <TemplateNotice tone="warning" title={t('lastError')}>
          <p className="mt-1">
            {format.label('submitReasons', draft.last_error_code)}
          </p>
        </TemplateNotice>
      )}

      {state === 'submitted' && impact && (
        <section
          className="border-border bg-card space-y-3 rounded-2xl border p-5 shadow-sm"
          aria-label={t('review.title')}
        >
          <h2 className="text-foreground text-base font-semibold">
            {t('review.title')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <TemplateStatusBadge
              status={impact.review_status as TemplateReviewStatus | null}
            />
            <Badge variant={impact.is_active ? 'outline' : 'secondary'}>
              {impact.is_active
                ? format.label('flags', 'active')
                : format.label('flags', 'inactive')}
            </Badge>
          </div>
          {impact.review_status === 'pending' && (
            <p className="text-muted-foreground text-sm">
              {t('review.pending', {
                hours: context.options.review_max_hours,
              })}
            </p>
          )}
          {impact.review_status === 'approved' && !impact.is_active && (
            <p className="text-sm">{t('review.approved')}</p>
          )}
          {impact.review_status === 'rejected' && (
            <TemplateNotice tone="danger" title={t('review.rejected')}>
              <p className="mt-1">
                {format.label(
                  'rejection',
                  impact.rejection_reason ?? 'unknown'
                )}
              </p>
            </TemplateNotice>
          )}
          {operator &&
            !editing &&
            (impact.edit.allowed ? (
              <Button variant="outline" onClick={() => setEditing(true)}>
                {t('edit.start')}
              </Button>
            ) : (
              impact.edit.refusal && (
                <p className="text-muted-foreground text-sm">
                  {format.label('editRefusals', impact.edit.refusal)}
                  {impact.edit.rule && impact.edit.rule !== 'akeed' && (
                    <span className="ms-1">
                      {t('edit.rule', { rule: impact.edit.rule })}
                    </span>
                  )}
                </p>
              )
            ))}
        </section>
      )}

      <TemplateDraftForm
        form={form}
        onChange={setForm}
        context={context}
        mode={mode}
        templateName={templateName}
        validation={validation}
      />

      {live.error && <TemplateErrorNotice error={live.error} />}
      {save.error && <TemplateErrorNotice error={save.error} />}
      {operator && (mode === 'new' || mode === 'draft') && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void saveDraft()} disabled={busy || !dirty}>
            {save.pending ? t('saving') : t('save')}
          </Button>
          {draft && (
            <>
              <Button
                variant="premium"
                disabled={busy || dirty || !validation?.valid || live.checking}
                onClick={() => {
                  submit.reset()
                  setDialog('submit')
                }}
              >
                {ts('button')}
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => setDialog('discard')}
              >
                {t('discard.button')}
              </Button>
            </>
          )}
          <p role="status" className="text-muted-foreground text-sm">
            {dirty
              ? t('unsaved')
              : validation && !validation.valid
                ? t('fixFirst')
                : save.result
                  ? t('saved')
                  : ''}
          </p>
        </div>
      )}
      {mode === 'text' && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={!dirty || !validation?.valid || live.checking}
            onClick={() => {
              edit.reset()
              setDialog('edit')
            }}
          >
            {t('edit.send')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(false)
              if (savedForm) setForm(savedForm)
            }}
          >
            {t('edit.cancel')}
          </Button>
        </div>
      )}

      {dialog === 'submit' && draft && (
        <TemplateConfirmDialog
          open
          onOpenChange={(open) => {
            if (open) return
            setDialog(null)
            // A refusal can change the draft too: it may now need a check.
            if (submit.result || submit.error) onChanged()
          }}
          title={ts('title')}
          description={ts('description')}
          confirmLabel={ts('confirm')}
          pending={submit.pending}
          done={submit.result !== null}
          onConfirm={() => void submitDraft()}
        >
          {!submit.result && (
            <SubmitFacts
              context={context}
              templateName={draft.template_name}
              languageCode={draft.language_code}
            />
          )}
          {submit.error && (
            <>
              <TemplateErrorNotice error={submit.error} />
              {submitReason && (
                <p role="alert" className="text-destructive">
                  {format.label('submitReasons', submitReason)}
                </p>
              )}
            </>
          )}
          {submit.result && (
            <TemplateNotice
              tone="success"
              title={t(`outcome.${submit.result.outcome}`)}
            >
              <p className="mt-1">
                {t('review.pending', {
                  hours: context.options.review_max_hours,
                })}
              </p>
            </TemplateNotice>
          )}
        </TemplateConfirmDialog>
      )}

      {dialog === 'discard' && draft && (
        <TemplateConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title={t('discard.title')}
          description={t('discard.description')}
          confirmLabel={t('discard.confirm')}
          destructive
          pending={discard.pending}
          onConfirm={() => void discardDraft()}
        >
          <p className="font-mono text-xs break-all" dir="ltr">
            {draft.template_name}
          </p>
          {discard.error && <TemplateErrorNotice error={discard.error} />}
        </TemplateConfirmDialog>
      )}

      {dialog === 'edit' && draft && impact && (
        <TemplateConfirmDialog
          open
          onOpenChange={(open) => {
            if (open) return
            setDialog(null)
            if (edit.result) {
              setEditing(false)
              onChanged()
            }
          }}
          title={t('edit.title')}
          description={t('edit.description')}
          confirmLabel={t('edit.confirm')}
          pending={edit.pending}
          done={edit.result !== null}
          onConfirm={() => void sendEdit()}
        >
          {!edit.result && (
            <>
              <TemplateNotice tone="warning" title={t('edit.warning')}>
                <p className="mt-1">
                  {t('edit.reReview', {
                    hours: context.options.review_max_hours,
                  })}
                </p>
              </TemplateNotice>
              {impact.review_status === 'approved' && (
                <p>
                  {t('edit.limits', {
                    perDay: impact.edit.limits.per_day,
                    perMonth: impact.edit.limits.per_30_days,
                    used: impact.edit.edits_last_30_days,
                  })}
                </p>
              )}
            </>
          )}
          {edit.error && (
            <>
              <TemplateErrorNotice error={edit.error} />
              {editReason && (
                <p role="alert" className="text-destructive">
                  {format.label('submitReasons', editReason)}
                </p>
              )}
            </>
          )}
          {edit.result && (
            <TemplateNotice tone="success" title={t('edit.sent')} />
          )}
        </TemplateConfirmDialog>
      )}
    </>
  )
}

/** A new draft: nothing exists yet, in Akeed or at Meta. */
export function TemplateDraftNewPage() {
  const t = useTranslations('adminTemplates')
  const state = useTemplateDrafts()
  return (
    <EditorShell title={t('editor.newTitle')}>
      {state.error && (
        <TemplateErrorNotice error={state.error} onRetry={state.refresh} />
      )}
      {!state.data && state.loading && (
        <p role="status" className="text-muted-foreground p-8 text-center">
          {t('loading')}
        </p>
      )}
      {state.data && (
        <DraftEditor
          context={state.data}
          draft={null}
          impact={null}
          onChanged={() => undefined}
        />
      )}
    </EditorShell>
  )
}

/** A saved draft, or the text of a template Meta already holds. */
export function TemplateDraftEditorPage({ draftId }: { draftId: string }) {
  const t = useTranslations('adminTemplates')
  const state = useTemplateDraft(draftId)
  const draft = state.data?.draft ?? null
  const impact = useTemplateImpact(draft?.template_key ?? null)
  const refresh = () => {
    state.refresh()
    impact.refresh()
  }

  return (
    <EditorShell title={draft?.template_name ?? t('editor.title')}>
      {state.error &&
        (state.error.status === 404 ? (
          <TemplateNotice tone="warning" title={t('editor.notFound')} />
        ) : (
          <TemplateErrorNotice
            error={state.error}
            onRetry={draft ? undefined : state.refresh}
          />
        ))}
      {impact.error && <TemplateErrorNotice error={impact.error} />}
      {!state.data && state.loading && (
        <p role="status" className="text-muted-foreground p-8 text-center">
          {t('loading')}
        </p>
      )}
      {state.data && draft && (
        <DraftEditor
          // A new server state starts a new form: the saved text is the truth.
          key={`${draft.id}:${draft.state}:${draft.state_changed_at}`}
          context={state.data}
          draft={draft}
          impact={impact.data}
          onChanged={refresh}
        />
      )}
    </EditorShell>
  )
}
