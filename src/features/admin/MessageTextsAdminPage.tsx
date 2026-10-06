'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge, Button } from '@/shared/ui'
import { AdminApiError } from './adminApi'
import { getMessageTexts, saveMessageText } from './adminMessageTextsApi'
import { AdminEmptyState, AdminPageHeader } from './AdminUi'
import {
  groupMessageTexts,
  MESSAGE_TEXT_STYLE_PATTERN,
  type MessageText,
  type MessageTextForm,
  type MessageTextPurpose,
  type MessageTextsResponse,
} from './admin-message-texts.model'
import { TemplateErrorNotice } from './TemplateAdminUi'
import { TemplateNotice, templateFieldClass } from './TemplateWriteUi'
import { toTemplateError } from './useAdminTemplateDrafts'

type Loaded =
  | { state: 'loading' }
  | { state: 'error'; error: AdminApiError }
  | { state: 'ready'; data: MessageTextsResponse }

function useMessageTexts() {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<Loaded>({ state: 'loading' })

  useEffect(() => {
    let current = true
    getMessageTexts()
      .then((data) => {
        if (current) setResult({ state: 'ready', data })
      })
      .catch((cause: unknown) => {
        if (current)
          setResult({
            state: 'error',
            error: toTemplateError('message texts load', cause),
          })
      })
    return () => {
      current = false
    }
  }, [revision])

  const reload = useCallback(() => setRevision((value) => value + 1), [])
  return { result, reload }
}

/** Why a save was refused, in the operator's language. */
function useSaveError() {
  const t = useTranslations('adminMessageTexts')
  return (error: AdminApiError): string | null => {
    const rule = error.details?.rule
    if (typeof rule === 'string' && t.has(`rules.${rule}`))
      return t(`rules.${rule}`)
    return null
  }
}

interface TextEditorProps {
  initial: MessageTextForm
  /** An existing text: purpose, language and style are fixed. */
  existing?: MessageText
  options: MessageTextsResponse['options']
  canWrite: boolean
  onSaved: () => void
}

function TextEditor({
  initial,
  existing,
  options,
  canWrite,
  onSaved,
}: TextEditorProps) {
  const t = useTranslations('adminMessageTexts')
  const ruleOf = useSaveError()
  const id = useId()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const isFallback = options.variables[form.purpose].length === 0
  const limit = isFallback ? options.limits.fallback : options.limits.body
  const styleValid = MESSAGE_TEXT_STYLE_PATTERN.test(form.style)
  const dirty =
    !existing ||
    existing.body !== form.body ||
    existing.is_active !== form.is_active
  const set = <K extends keyof MessageTextForm>(
    key: K,
    value: MessageTextForm[K]
  ) => {
    setSaved(null)
    setForm((current) => ({ ...current, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await saveMessageText({
        ...form,
        body: form.body.trim(),
        style: form.style.trim(),
      })
      setSaved(t(`change.${result.change}`))
      onSaved()
    } catch (cause) {
      setError(toTemplateError('message text save', cause))
    } finally {
      setSaving(false)
    }
  }

  const rule = error ? ruleOf(error) : null

  return (
    <form
      className="border-border bg-card space-y-3 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      {!existing && (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm" htmlFor={`${id}-purpose`}>
            <span className="font-medium">{t('fields.purpose')}</span>
            <select
              id={`${id}-purpose`}
              className={templateFieldClass}
              value={form.purpose}
              disabled={!canWrite}
              onChange={(event) =>
                set('purpose', event.target.value as MessageTextPurpose)
              }
            >
              {options.purposes.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {t(`purposes.${purpose}.title`)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm" htmlFor={`${id}-language`}>
            <span className="font-medium">{t('fields.language')}</span>
            <select
              id={`${id}-language`}
              className={templateFieldClass}
              value={form.language}
              disabled={!canWrite}
              onChange={(event) =>
                set('language', event.target.value as 'ar' | 'en')
              }
            >
              {options.languages.map((language) => (
                <option key={language} value={language}>
                  {t(`languages.${language}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm" htmlFor={`${id}-style`}>
            <span className="font-medium">{t('fields.style')}</span>
            <input
              id={`${id}-style`}
              className={templateFieldClass}
              value={form.style}
              dir="ltr"
              disabled={!canWrite || isFallback}
              aria-invalid={styleValid ? undefined : true}
              onChange={(event) => set('style', event.target.value)}
            />
          </label>
        </div>
      )}
      <label className="block space-y-1 text-sm" htmlFor={`${id}-body`}>
        <span className="font-medium">
          {existing
            ? t('existingLabel', {
                language: t(`languages.${existing.language}`),
                style: existing.style,
              })
            : t('fields.body')}
        </span>
        <textarea
          id={`${id}-body`}
          className={templateFieldClass}
          rows={isFallback ? 1 : 3}
          maxLength={limit}
          dir={form.language === 'ar' ? 'rtl' : 'ltr'}
          lang={form.language}
          value={form.body}
          disabled={!canWrite}
          onChange={(event) => set('body', event.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            disabled={!canWrite}
            onChange={(event) => set('is_active', event.target.checked)}
          />
          {t('fields.active')}
        </label>
        {canWrite && (
          <Button
            type="submit"
            disabled={saving || !dirty || !form.body.trim() || !styleValid}
            aria-busy={saving}
          >
            {saving ? t('saving') : t('save')}
          </Button>
        )}
      </div>
      {saved && (
        <p role="status" className="text-muted-foreground text-sm">
          {saved}
        </p>
      )}
      {error &&
        (rule ? (
          <TemplateNotice tone="danger" title={t('refused')}>
            <p>{rule}</p>
          </TemplateNotice>
        ) : (
          <TemplateErrorNotice error={error} />
        ))}
    </form>
  )
}

/**
 * Staff manage the free-form texts of US-08-07 here: what a customer reads
 * after confirming or cancelling, the nudge after a reply Akeed could not
 * read, and the words for a missing name. A named template operator saves;
 * every change is audited.
 */
export function MessageTextsAdminPage() {
  const t = useTranslations('adminMessageTexts')
  const tAccess = useTranslations('adminTemplates.access')
  const { result, reload } = useMessageTexts()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />
      {result.state === 'loading' && (
        <p role="status" className="text-muted-foreground text-sm">
          {t('loading')}
        </p>
      )}
      {result.state === 'error' && (
        <TemplateErrorNotice error={result.error} onRetry={reload} />
      )}
      {result.state === 'ready' && (
        <MessageTextsContent data={result.data} onSaved={reload}>
          {!(
            result.data.operations.enabled && result.data.operations.operator
          ) && (
            <TemplateNotice
              tone="info"
              title={
                result.data.operations.enabled
                  ? tAccess('notOperator')
                  : tAccess('disabled')
              }
            />
          )}
        </MessageTextsContent>
      )}
    </div>
  )
}

function MessageTextsContent({
  data,
  onSaved,
  children,
}: {
  data: MessageTextsResponse
  onSaved: () => void
  children?: React.ReactNode
}) {
  const t = useTranslations('adminMessageTexts')
  const canWrite = data.operations.enabled && data.operations.operator
  const groups = groupMessageTexts(data.texts, data.options.purposes)
  const switchOf: Record<MessageTextPurpose, boolean> = {
    ack_confirmed: data.switches.acknowledgment,
    ack_canceled: data.switches.acknowledgment,
    unresolved_reply_nudge: data.switches.unresolved_reply_nudge,
    fallback_customer_name: data.switches.localized_fallbacks,
    fallback_store_name: data.switches.localized_fallbacks,
  }

  return (
    <>
      {children}
      {data.texts.length === 0 && (
        <AdminEmptyState
          icon={MessageSquareText}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      )}
      {groups.map(({ purpose, texts }) => (
        <section key={purpose} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-foreground font-semibold">
              {t(`purposes.${purpose}.title`)}
            </h2>
            <Badge variant={switchOf[purpose] ? 'success' : 'neutral'}>
              {switchOf[purpose] ? t('switchOn') : t('switchOff')}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {t(`purposes.${purpose}.help`)}
          </p>
          {texts.map((text) => (
            <TextEditor
              key={`${text.id}-${text.updated_at}`}
              existing={text}
              initial={{
                purpose: text.purpose,
                language: text.language,
                style: text.style,
                body: text.body,
                is_active: text.is_active,
              }}
              options={data.options}
              canWrite={canWrite}
              onSaved={onSaved}
            />
          ))}
        </section>
      ))}
      {canWrite && (
        <section className="space-y-3">
          <h2 className="text-foreground font-semibold">{t('addTitle')}</h2>
          <TextEditor
            key={data.texts.length}
            initial={{
              purpose: data.options.purposes[0] ?? 'ack_confirmed',
              language: 'ar',
              style: data.options.default_style,
              body: '',
              is_active: true,
            }}
            options={data.options}
            canWrite={canWrite}
            onSaved={onSaved}
          />
        </section>
      )}
    </>
  )
}
