'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  getLocaleDirection,
  getLocaleNativeName,
  resolveSupportedLocale,
} from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'
import { AdminSelect } from './AdminUi'
import {
  TIP_FALLBACK_LOCALE,
  TIP_LIMITS,
  TIP_LOCALES,
  addTipLocale,
  localInputToIso,
  removeTipLocale,
  tipIssueKey,
  type AdminTipOptions,
  type TipActionKind,
  type TipContentForm,
  type TipForm,
  type TipFormIssues,
  type TipType,
} from './admin-tips.model'
import { templateFieldClass } from './TemplateWriteUi'
import { TipFieldError } from './TipsAdminUi'

interface TipContentFieldsProps {
  form: TipForm
  onChange: (next: TipForm) => void
  issues: TipFormIssues
  options: AdminTipOptions | null
  /** Archived campaigns are read-only. */
  readOnly: boolean
  /** The expiry is set in the draft only. */
  expiryLocked: boolean
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-foreground/80 mb-1.5 block text-xs font-medium"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      <TipFieldError id={`${id}-error`} code={error} />
    </div>
  )
}

function counter(value: string, max: number): string {
  return `${[...value.trim()].length}/${max}`
}

/** Name, type, the card text in each language, the button and the expiry. */
export function TipContentFields({
  form,
  onChange,
  issues,
  options,
  readOnly,
  expiryLocked,
}: TipContentFieldsProps) {
  const t = useTranslations('adminTips.editor')
  const tRoutes = useTranslations('adminTips.routes')
  const [active, setActive] = useState(TIP_FALLBACK_LOCALE)
  const locale = form.locales.includes(active) ? active : TIP_FALLBACK_LOCALE
  const content = form.content[locale]
  const missing = TIP_LOCALES.filter(
    (candidate) => !form.locales.includes(candidate)
  )
  const hasAction = form.actionKind !== 'none'

  const setContent = (patch: Partial<TipContentForm>) =>
    onChange({
      ...form,
      content: { ...form.content, [locale]: { ...content, ...patch } },
    })

  const errorRef = (id: string, key: string) =>
    issues[key] ? `${id}-error` : undefined

  return (
    <fieldset disabled={readOnly} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <Field
          id="tip-name"
          label={t('name')}
          hint={t('nameHint')}
          error={issues.name}
        >
          <input
            id="tip-name"
            className={templateFieldClass}
            value={form.name}
            maxLength={TIP_LIMITS.name * 2}
            aria-invalid={!!issues.name}
            aria-describedby={issues.name ? 'tip-name-error' : undefined}
            onChange={(event) =>
              onChange({ ...form, name: event.target.value })
            }
          />
        </Field>
        <AdminSelect
          label={t('type')}
          value={form.type}
          onChange={(event) =>
            onChange({ ...form, type: event.target.value as TipType })
          }
          options={[
            { value: 'tip', label: t('typeTip') },
            { value: 'update', label: t('typeUpdate') },
            { value: 'change', label: t('typeChange') },
            { value: 'note', label: t('typeNote') },
          ]}
        />
      </div>

      <section className="border-border rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label={t('languages')}
            className="flex flex-wrap gap-1"
          >
            {form.locales.map((candidate) => {
              const invalid = ['title', 'description', 'action_label'].some(
                (field) => issues[tipIssueKey(field, candidate)]
              )
              return (
                <button
                  key={candidate}
                  type="button"
                  role="tab"
                  aria-selected={candidate === locale}
                  onClick={() => setActive(candidate)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium',
                    candidate === locale
                      ? 'border-primary bg-primary-subtle text-primary'
                      : 'border-border text-foreground/70 hover:bg-muted',
                    invalid && 'border-destructive-border'
                  )}
                >
                  {getLocaleNativeName(resolveSupportedLocale(candidate))}
                  {candidate === TIP_FALLBACK_LOCALE && ` · ${t('required')}`}
                  {invalid && (
                    <span className="sr-only"> ({t('hasErrors')})</span>
                  )}
                </button>
              )
            })}
          </div>
          {missing.length > 0 && (
            <AdminSelect
              className="ms-auto w-48"
              label={t('addLanguage')}
              hideLabel
              value=""
              onChange={(event) => {
                if (!event.target.value) return
                onChange(addTipLocale(form, event.target.value))
                setActive(event.target.value)
              }}
              options={[
                { value: '', label: t('addLanguage') },
                ...missing.map((candidate) => ({
                  value: candidate,
                  label: getLocaleNativeName(resolveSupportedLocale(candidate)),
                })),
              ]}
            />
          )}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          {t('languagesHint')}
        </p>

        <div
          className="mt-4 space-y-4"
          lang={locale}
          dir={getLocaleDirection(locale)}
        >
          <Field
            id={`tip-title-${locale}`}
            label={`${t('title')} (${counter(content.title, TIP_LIMITS.title)})`}
            error={issues[tipIssueKey('title', locale)]}
          >
            <textarea
              id={`tip-title-${locale}`}
              rows={2}
              className={templateFieldClass}
              value={content.title}
              aria-invalid={!!issues[tipIssueKey('title', locale)]}
              aria-describedby={errorRef(
                `tip-title-${locale}`,
                tipIssueKey('title', locale)
              )}
              onChange={(event) => setContent({ title: event.target.value })}
            />
          </Field>
          <Field
            id={`tip-description-${locale}`}
            label={`${t('descriptionField')} (${counter(content.description, TIP_LIMITS.description)})`}
            hint={t('plainTextHint')}
            error={issues[tipIssueKey('description', locale)]}
          >
            <textarea
              id={`tip-description-${locale}`}
              rows={5}
              className={templateFieldClass}
              value={content.description}
              aria-invalid={!!issues[tipIssueKey('description', locale)]}
              aria-describedby={errorRef(
                `tip-description-${locale}`,
                tipIssueKey('description', locale)
              )}
              onChange={(event) =>
                setContent({ description: event.target.value })
              }
            />
          </Field>
          {hasAction && (
            <Field
              id={`tip-action_label-${locale}`}
              label={`${t('buttonLabel')} (${counter(content.actionLabel, TIP_LIMITS.actionLabel)})`}
              error={issues[tipIssueKey('action_label', locale)]}
            >
              <input
                id={`tip-action_label-${locale}`}
                className={templateFieldClass}
                value={content.actionLabel}
                aria-invalid={!!issues[tipIssueKey('action_label', locale)]}
                aria-describedby={errorRef(
                  `tip-action_label-${locale}`,
                  tipIssueKey('action_label', locale)
                )}
                onChange={(event) =>
                  setContent({ actionLabel: event.target.value })
                }
              />
            </Field>
          )}
        </div>
        {locale !== TIP_FALLBACK_LOCALE && (
          <Button
            type="button"
            variant="ghost"
            className="mt-3"
            onClick={() => {
              onChange(removeTipLocale(form, locale))
              setActive(TIP_FALLBACK_LOCALE)
            }}
          >
            <X className="size-4" aria-hidden="true" />
            {t('removeLanguage', {
              language: getLocaleNativeName(resolveSupportedLocale(locale)),
            })}
          </Button>
        )}
      </section>

      <section className="border-border space-y-4 rounded-xl border p-4">
        <AdminSelect
          label={t('button')}
          value={form.actionKind}
          onChange={(event) =>
            onChange({
              ...form,
              actionKind: event.target.value as TipActionKind,
            })
          }
          options={[
            { value: 'none', label: t('buttonNone') },
            { value: 'internal', label: t('buttonInternal') },
            { value: 'external', label: t('buttonExternal') },
          ]}
        />
        {form.actionKind === 'internal' && (
          <div>
            <AdminSelect
              label={t('buttonPage')}
              value={form.actionRoute}
              aria-invalid={!!issues['action.route']}
              onChange={(event) =>
                onChange({ ...form, actionRoute: event.target.value })
              }
              options={[
                { value: '', label: t('buttonPagePlaceholder') },
                ...(options?.action_routes ?? []).map((route) => ({
                  value: route.key,
                  label:
                    route.modes.length === 1
                      ? `${tRoutes(route.key)} · ${t(`modeOnly.${route.modes[0]}`)}`
                      : tRoutes(route.key),
                })),
              ]}
            />
            <TipFieldError
              id="action-route-error"
              code={issues['action.route']}
            />
          </div>
        )}
        {form.actionKind === 'external' && (
          <Field
            id="tip-action-url"
            label={t('buttonUrl')}
            hint={t('buttonUrlHint')}
            error={issues['action.url']}
          >
            <input
              id="tip-action-url"
              type="url"
              dir="ltr"
              inputMode="url"
              className={templateFieldClass}
              value={form.actionUrl}
              placeholder="https://"
              aria-invalid={!!issues['action.url']}
              aria-describedby={errorRef('tip-action-url', 'action.url')}
              onChange={(event) =>
                onChange({ ...form, actionUrl: event.target.value })
              }
            />
          </Field>
        )}
      </section>

      <section className="border-border rounded-xl border p-4">
        <Field
          id="tip-expires"
          label={t('expiry')}
          hint={
            expiryLocked
              ? t('expiryLocked')
              : form.expiresLocal
                ? t('expiryHintSet', {
                    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    utc: localInputToIso(form.expiresLocal) || '—',
                  })
                : t('expiryHint', {
                    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  })
          }
          error={issues.expires_at}
        >
          <input
            id="tip-expires"
            type="datetime-local"
            dir="ltr"
            className={cn(templateFieldClass, 'sm:w-72')}
            value={form.expiresLocal}
            disabled={expiryLocked}
            aria-invalid={!!issues.expires_at}
            aria-describedby={
              issues.expires_at ? 'tip-expires-error' : undefined
            }
            onChange={(event) =>
              onChange({ ...form, expiresLocal: event.target.value })
            }
          />
        </Field>
      </section>
    </fieldset>
  )
}
