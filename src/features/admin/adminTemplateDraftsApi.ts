import { adminRequest } from './adminApi'
import type {
  TemplateDraft,
  TemplateDraftCheck,
  TemplateDraftForm,
  TemplateDraftListResponse,
  TemplateDraftResponse,
  TemplateImpact,
  TemplateLifecycleAction,
  TemplateLifecycleResult,
  TemplateSubmitResult,
} from './admin-template-drafts.model'

const path = '/api/admin/templates'

function send<T>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
) {
  return adminRequest<T>(url, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  })
}

const draftPath = (id: string) => `${path}/drafts/${encodeURIComponent(id)}`
const templatePath = (key: string) => `${path}/${encodeURIComponent(key)}`

type TemplateText = Pick<
  TemplateDraftForm,
  'body' | 'confirm_label' | 'cancel_label' | 'samples'
>

function textOf(form: TemplateDraftForm): TemplateText {
  return {
    body: form.body,
    confirm_label: form.confirm_label,
    cancel_label: form.cancel_label,
    samples: form.samples,
  }
}

export function getTemplateDrafts() {
  return adminRequest<TemplateDraftListResponse>(`${path}/drafts`)
}

export function getTemplateDraft(id: string) {
  return adminRequest<TemplateDraftResponse>(draftPath(id))
}

export function checkTemplateDraft(form: TemplateDraftForm, draftId?: string) {
  return send<TemplateDraftCheck>(`${path}/drafts/validate`, 'POST', {
    ...form,
    ...(draftId ? { draft_id: draftId } : {}),
  })
}

export function createTemplateDraft(form: TemplateDraftForm) {
  return send<{ draft: TemplateDraft }>(`${path}/drafts`, 'POST', form)
}

export function updateTemplateDraft(id: string, form: TemplateDraftForm) {
  return send<{ draft: TemplateDraft }>(draftPath(id), 'PATCH', {
    ...textOf(form),
    language_code: form.language_code,
    parameter_format: form.parameter_format,
  })
}

export function discardTemplateDraft(id: string) {
  return send<{ discarded: true }>(draftPath(id), 'DELETE')
}

export function submitTemplateDraft(id: string) {
  return send<TemplateSubmitResult>(`${draftPath(id)}/submit`, 'POST')
}

export function reconcileTemplateDraft(id: string) {
  return send<TemplateSubmitResult>(`${draftPath(id)}/reconcile`, 'POST')
}

export function getTemplateImpact(key: string) {
  return adminRequest<TemplateImpact>(`${templatePath(key)}/impact`)
}

export function editTemplateText(key: string, form: TemplateDraftForm) {
  return send<{ key: string; review_status: 'pending' }>(
    `${templatePath(key)}/edit`,
    'POST',
    textOf(form)
  )
}

export function runTemplateAction(
  key: string,
  action: TemplateLifecycleAction,
  replacementKey?: string
) {
  return send<TemplateLifecycleResult>(
    `${templatePath(key)}/${action}`,
    'POST',
    replacementKey ? { replacement_key: replacementKey } : {}
  )
}
