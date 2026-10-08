import type {
  RenderedTemplateMessage,
  TemplateLanguage,
  TemplateTone,
} from './admin-templates.model'

export type TemplateVariableName = 'customer' | 'store' | 'order' | 'total'

export type TemplateDraftState =
  | 'draft'
  | 'submitting'
  | 'submit_unknown'
  | 'submitted'

export type TemplateDraftSamples = Partial<Record<TemplateVariableName, string>>

/** One validation finding; `rule` is translated, `finding` cites the record. */
export interface TemplateDraftIssue {
  field: string
  rule: string
  finding: string
  severity: 'error' | 'warning'
}

export interface TemplateDraftValidation {
  valid: boolean
  issues: TemplateDraftIssue[]
}

export interface TemplateDraftVariableRow {
  variable: TemplateVariableName
  parameter: string
  sample: string
}

export interface TemplateDraft {
  id: string
  key: string
  purpose: string
  language: TemplateLanguage
  style: string
  version: number
  template_name: string
  language_code: string
  parameter_format: 'named' | 'positional'
  category: string
  body: string
  confirm_label: string
  cancel_label: string
  samples: TemplateDraftSamples
  state: TemplateDraftState
  state_changed_at: string
  last_error_code: string | null
  template_key: string | null
  created_at: string
  updated_at: string
  variables: TemplateDraftVariableRow[]
  validation: TemplateDraftValidation
  preview: RenderedTemplateMessage
}

export interface TemplateAuthoringContext {
  operations: { enabled: boolean; operator: boolean }
  environment: { production: boolean; account_suffix: string | null }
  options: {
    purposes: string[]
    language_codes: Record<TemplateLanguage, string[]>
    variables: TemplateVariableName[]
    sample_defaults: Record<
      TemplateLanguage,
      Record<TemplateVariableName, string>
    >
    category: Record<string, string>
    limits: { body: number; button_label: number; style: number }
    review_max_hours: number
  }
}

export interface TemplateDraftListResponse extends TemplateAuthoringContext {
  drafts: TemplateDraft[]
}

export interface TemplateDraftResponse extends TemplateAuthoringContext {
  draft: TemplateDraft
}

/** What the operator is writing: the request body of a create or a check. */
export interface TemplateDraftForm {
  purpose: string
  language: TemplateLanguage
  style: string
  language_code: string
  parameter_format: 'named' | 'positional'
  body: string
  confirm_label: string
  cancel_label: string
  samples: TemplateDraftSamples
}

export interface TemplateDraftCheck {
  template_name: string
  key: string
  version: number
  variables: TemplateDraftVariableRow[]
  validation: TemplateDraftValidation
}

export type TemplateSubmitOutcome =
  | 'created'
  | 'adopted'
  | 'already_submitted'
  | 'not_at_provider'

export interface TemplateSubmitResult {
  outcome: TemplateSubmitOutcome
  draft: TemplateDraft
}

export type TemplateLifecycleAction =
  | 'activate'
  | 'deactivate'
  | 'set-default'
  | 'retire'

export interface TemplateImpact {
  key: string
  is_active: boolean
  is_default: boolean
  retired: boolean
  review_status: string | null
  rejection_reason: string | null
  stores: { total: number; active: number }
  requires_replacement: boolean
  replacements: { key: string; style: string; template_name: string }[]
  edit: {
    allowed: boolean
    refusal: string | null
    rule: string | null
    draft_id: string | null
    edits_last_day: number
    edits_last_30_days: number
    limits: { per_day: number; per_30_days: number }
  }
}

export interface TemplateLifecycleResult {
  key: string
  changed: boolean
  is_active: boolean
  is_default: boolean
  retired: boolean
  replacement_key: string | null
  moved_stores: number
}

export function emptyDraftForm(
  context: TemplateAuthoringContext,
  language: TemplateLanguage = 'ar'
): TemplateDraftForm {
  return {
    purpose: context.options.purposes[0] ?? 'cod_confirmation',
    language,
    style: '',
    language_code: context.options.language_codes[language][0] ?? language,
    parameter_format: 'named',
    body: '',
    confirm_label: '',
    cancel_label: '',
    samples: { ...context.options.sample_defaults[language] },
  }
}

export function draftToForm(draft: TemplateDraft): TemplateDraftForm {
  return {
    purpose: draft.purpose,
    language: draft.language,
    style: draft.style,
    language_code: draft.language_code,
    parameter_format: draft.parameter_format,
    body: draft.body,
    confirm_label: draft.confirm_label,
    cancel_label: draft.cancel_label,
    samples: { ...draft.samples },
  }
}

const TOKEN = /{{\s*([a-z_]+)\s*}}/g

/** The variables a body uses, in first-use order. */
export function draftVariables(
  body: string,
  allowed: readonly TemplateVariableName[]
): TemplateVariableName[] {
  const used: TemplateVariableName[] = []
  for (const match of body.matchAll(TOKEN)) {
    const name = match[1] as TemplateVariableName
    if (allowed.includes(name) && !used.includes(name)) used.push(name)
  }
  return used
}

/**
 * The message as the phone preview shows it while the operator types: each
 * `{{variable}}` replaced by its sample, one paragraph per non-empty line.
 */
export function previewDraft(form: TemplateDraftForm): RenderedTemplateMessage {
  const filled = form.body.replace(TOKEN, (token, name: string) => {
    const sample = form.samples[name as TemplateVariableName]
    return sample && sample.length > 0 ? sample : token
  })
  return {
    paragraphs: filled
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
    buttons: [
      { label: form.confirm_label, kind: 'quick_reply' },
      { label: form.cancel_label, kind: 'quick_reply' },
    ].filter((button) => button.label.trim().length > 0),
    direction: form.language === 'ar' ? 'rtl' : 'ltr',
  }
}

/** Puts `{{name}}` at the caret, replacing any selection. */
export function insertVariable(
  body: string,
  name: TemplateVariableName,
  start: number,
  end: number
): { body: string; caret: number } {
  const token = `{{${name}}}`
  return {
    body: body.slice(0, start) + token + body.slice(end),
    caret: start + token.length,
  }
}

export function draftStateTone(state: TemplateDraftState): TemplateTone {
  if (state === 'submitted') return 'success'
  if (state === 'submit_unknown') return 'danger'
  return state === 'submitting' ? 'warning' : 'outline'
}

/** The issues of one form field, errors first. */
export function issuesFor(
  validation: TemplateDraftValidation | null,
  fields: readonly string[]
): TemplateDraftIssue[] {
  return (validation?.issues ?? [])
    .filter((issue) => fields.includes(issue.field))
    .sort((left, right) => left.severity.localeCompare(right.severity))
}
