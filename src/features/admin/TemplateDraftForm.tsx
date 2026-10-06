'use client'

import { useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'
import { WhatsAppPhonePreview } from '@/shared/ui/whatsapp'
import { useTemplateFormat } from './TemplateAdminUi'
import { TemplateIssues, templateFieldClass } from './TemplateWriteUi'
import {
  draftVariables,
  insertVariable,
  issuesFor,
  previewDraft,
  type TemplateAuthoringContext,
  type TemplateDraftForm as DraftForm,
  type TemplateDraftValidation,
  type TemplateVariableName,
} from './admin-template-drafts.model'
import type { TemplateLanguage } from './admin-templates.model'

/**
 * What the operator may change:
 * - `new`: everything;
 * - `draft`: everything but purpose, language and style, which name it;
 * - `text`: the text only, for an edit of a template Meta already holds;
 * - `readonly`: nothing.
 */
export type TemplateDraftFormMode = 'new' | 'draft' | 'text' | 'readonly'

function Field({
  id,
  label,
  hint,
  issues,
  children,
}: {
  id: string
  label: string
  hint?: string
  issues?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {issues}
    </div>
  )
}

interface TemplateDraftFormProps {
  form: DraftForm
  onChange: (form: DraftForm) => void
  context: TemplateAuthoringContext
  mode: TemplateDraftFormMode
  /** The name the backend generates for this draft, once it has answered. */
  templateName: string | null
  validation: TemplateDraftValidation | null
}

export function TemplateDraftForm({
  form,
  onChange,
  context,
  mode,
  templateName,
  validation,
}: TemplateDraftFormProps) {
  const t = useTranslations('adminTemplates.editor')
  const tp = useTranslations('adminTemplates.preview')
  const format = useTemplateFormat()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const { options } = context
  const identityLocked = mode !== 'new'
  const settingsLocked = mode === 'text' || mode === 'readonly'
  const textLocked = mode === 'readonly'
  const used = draftVariables(form.body, options.variables)
  const preview = previewDraft(form)

  const set = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) =>
    onChange({ ...form, [key]: value })

  function setLanguage(language: TemplateLanguage) {
    onChange({
      ...form,
      language,
      language_code: options.language_codes[language][0] ?? language,
      samples: { ...options.sample_defaults[language] },
    })
  }

  function addVariable(name: TemplateVariableName) {
    const area = bodyRef.current
    const start = area?.selectionStart ?? form.body.length
    const end = area?.selectionEnd ?? form.body.length
    const next = insertVariable(form.body, name, start, end)
    set('body', next.body)
    requestAnimationFrame(() => {
      area?.focus()
      area?.setSelectionRange(next.caret, next.caret)
    })
  }

  const issues = (id: string, fields: string[]) => {
    const found = issuesFor(validation, fields)
    return {
      node: <TemplateIssues id={`${id}-issues`} issues={found} />,
      invalid: found.some((issue) => issue.severity === 'error'),
      describedBy: found.length > 0 ? `${id}-issues` : undefined,
    }
  }
  const style = issues('draft-style', ['style', 'name'])
  const code = issues('draft-language-code', ['language_code'])
  const body = issues('draft-body', ['body', 'variables'])
  const confirm = issues('draft-confirm', ['confirm_label'])
  const cancel = issues('draft-cancel', ['cancel_label', 'buttons'])
  const samples = issues('draft-samples', ['samples'])
  const category = issues('draft-category', ['category'])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="space-y-6">
        <fieldset className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
          <legend className="text-foreground px-1 text-base font-semibold">
            {t('identity')}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="draft-purpose" label={t('purpose')}>
              <select
                id="draft-purpose"
                className={templateFieldClass}
                value={form.purpose}
                disabled={identityLocked}
                onChange={(event) => set('purpose', event.target.value)}
              >
                {options.purposes.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {format.label('purpose', purpose)}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="draft-language" label={t('language')}>
              <select
                id="draft-language"
                className={templateFieldClass}
                value={form.language}
                disabled={identityLocked}
                onChange={(event) =>
                  setLanguage(event.target.value as TemplateLanguage)
                }
              >
                {(
                  Object.keys(options.language_codes) as TemplateLanguage[]
                ).map((language) => (
                  <option key={language} value={language}>
                    {format.label('language', language)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="draft-style"
              label={t('style')}
              hint={t('styleHint', { max: options.limits.style })}
              issues={style.node}
            >
              <input
                id="draft-style"
                dir="ltr"
                className={cn(templateFieldClass, 'font-mono')}
                value={form.style}
                disabled={identityLocked}
                aria-invalid={style.invalid}
                aria-describedby={cn('draft-style-hint', style.describedBy)}
                onChange={(event) => set('style', event.target.value)}
              />
            </Field>
            <Field
              id="draft-language-code"
              label={t('languageCode')}
              issues={code.node}
            >
              <select
                id="draft-language-code"
                dir="ltr"
                className={cn(templateFieldClass, 'font-mono')}
                value={form.language_code}
                disabled={settingsLocked}
                aria-invalid={code.invalid}
                aria-describedby={code.describedBy}
                onChange={(event) => set('language_code', event.target.value)}
              >
                {options.language_codes[form.language].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="draft-format" label={t('parameterFormat')}>
              <select
                id="draft-format"
                className={templateFieldClass}
                value={form.parameter_format}
                disabled={settingsLocked}
                onChange={(event) =>
                  set(
                    'parameter_format',
                    event.target.value as DraftForm['parameter_format']
                  )
                }
              >
                {(['named', 'positional'] as const).map((value) => (
                  <option key={value} value={value}>
                    {format.label('parameterFormat', value)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-medium">{t('category')}</p>
              <p className="text-sm">
                {format.label(
                  'category',
                  options.category[form.purpose] ?? 'unknown'
                )}
              </p>
              {category.node}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">{t('generatedName')}</p>
            <p
              className="mt-1 font-mono text-sm break-all"
              dir="ltr"
              data-testid="draft-template-name"
            >
              {templateName ?? t('generatedNamePending')}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t('generatedNameHint')}
            </p>
          </div>
        </fieldset>

        <fieldset className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
          <legend className="text-foreground px-1 text-base font-semibold">
            {t('text')}
          </legend>
          <Field
            id="draft-body"
            label={t('body')}
            hint={t('bodyHint', {
              count: form.body.length,
              max: options.limits.body,
            })}
            issues={body.node}
          >
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label={t('variablePicker')}
            >
              <span className="text-muted-foreground text-xs">
                {t('variablePicker')}
              </span>
              {options.variables.map((name) => (
                <Button
                  key={name}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={textLocked}
                  onClick={() => addVariable(name)}
                >
                  {format.label('variables.names', name)}
                </Button>
              ))}
            </div>
            <textarea
              id="draft-body"
              ref={bodyRef}
              rows={9}
              dir={form.language === 'ar' ? 'rtl' : 'ltr'}
              className={templateFieldClass}
              value={form.body}
              disabled={textLocked}
              aria-invalid={body.invalid}
              aria-describedby={cn('draft-body-hint', body.describedBy)}
              onChange={(event) => set('body', event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="draft-confirm"
              label={t('confirmLabel')}
              hint={t('labelHint', { max: options.limits.button_label })}
              issues={confirm.node}
            >
              <input
                id="draft-confirm"
                dir={form.language === 'ar' ? 'rtl' : 'ltr'}
                className={templateFieldClass}
                value={form.confirm_label}
                disabled={textLocked}
                aria-invalid={confirm.invalid}
                aria-describedby={cn('draft-confirm-hint', confirm.describedBy)}
                onChange={(event) => set('confirm_label', event.target.value)}
              />
            </Field>
            <Field
              id="draft-cancel"
              label={t('cancelLabel')}
              hint={t('labelHint', { max: options.limits.button_label })}
              issues={cancel.node}
            >
              <input
                id="draft-cancel"
                dir={form.language === 'ar' ? 'rtl' : 'ltr'}
                className={templateFieldClass}
                value={form.cancel_label}
                disabled={textLocked}
                aria-invalid={cancel.invalid}
                aria-describedby={cn('draft-cancel-hint', cancel.describedBy)}
                onChange={(event) => set('cancel_label', event.target.value)}
              />
            </Field>
          </div>
          <p className="text-muted-foreground text-xs">{t('buttonsHint')}</p>
        </fieldset>

        <fieldset className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
          <legend className="text-foreground px-1 text-base font-semibold">
            {t('samples')}
          </legend>
          <p className="text-muted-foreground text-sm">{t('samplesHint')}</p>
          {used.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('samplesEmpty')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {used.map((name) => (
                <Field
                  key={name}
                  id={`draft-sample-${name}`}
                  label={format.label('variables.names', name)}
                >
                  <input
                    id={`draft-sample-${name}`}
                    className={templateFieldClass}
                    value={form.samples[name] ?? ''}
                    disabled={textLocked}
                    aria-invalid={samples.invalid}
                    aria-describedby={samples.describedBy}
                    onChange={(event) =>
                      set('samples', {
                        ...form.samples,
                        [name]: event.target.value,
                      })
                    }
                  />
                </Field>
              ))}
            </div>
          )}
          {samples.node}
        </fieldset>
      </div>

      <aside
        className="border-border bg-card h-fit space-y-4 rounded-2xl border p-5 shadow-sm lg:sticky lg:top-6"
        aria-label={t('preview')}
      >
        <h2 className="text-foreground text-base font-semibold">
          {t('preview')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('previewHint')}</p>
        {preview.paragraphs.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('previewEmpty')}</p>
        ) : (
          <WhatsAppPhonePreview
            senderName={tp('sender')}
            senderStatus={tp('senderStatus')}
            avatarAlt={tp('avatarAlt')}
            dayLabel={tp('day')}
            timeLabel={tp('time')}
            paragraphs={preview.paragraphs}
            buttons={preview.buttons
              .filter(
                (button, index, all) =>
                  all.findIndex((other) => other.label === button.label) ===
                  index
              )
              .map((button) => ({
                label: button.label,
                tone:
                  button.label === form.confirm_label ? 'confirm' : 'cancel',
              }))}
            messageDir={preview.direction}
          />
        )}
      </aside>
    </div>
  )
}
