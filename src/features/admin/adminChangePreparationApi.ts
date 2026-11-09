import { adminRequest } from './adminApi'
import type { TemplateLanguage } from './admin-templates.model'

export interface ChangePreparationVariant {
  parent_key: string
  language: TemplateLanguage
  style: string
  purpose: string
  draft_id: string | null
  key: string | null
  state: string
  review_status: string | null
  active: boolean
  blocked_reason: string | null
  differences: string[]
  content: {
    templateName: string
    languageCode: string
    parameterFormat: string
    category: string
    body: string
    confirmLabel: string
    cancelLabel: string
    changeLabel: string
    samples: Record<string, string>
  } | null
  validation: {
    valid: boolean
    variables?: { key: string; parameter: string; sample: string }[]
  } | null
  image_twin: {
    key: string | null
    template_name: string | null
    state: string
    review_status: string | null
    active: boolean
    header: string
    parent_key: string | null
  }
}
export interface ChangePreparationOverview {
  variants: ChangePreparationVariant[]
  draft_only_sources: {
    parent_key: string
    language: string
    style: string
    state: string
    reason: string
  }[]
}
const path = '/api/admin/templates/change-requests'
export const getChangePreparation = () =>
  adminRequest<ChangePreparationOverview>(path)
export const prepareChangeDrafts = () =>
  adminRequest<{
    results: { parent_key: string; outcome: string; reason?: string }[]
  }>(`${path}/prepare`, { method: 'POST' })

export function changePreparationMarkdown(
  page: ChangePreparationOverview
): string {
  const providerBody = (variant: ChangePreparationVariant) => {
    const variables = variant.validation?.variables ?? []
    return (
      variant.content?.body.replace(
        /{{\s*([a-z_]+)\s*}}/g,
        (token, key: string) => {
          const variable = variables.find((value) => value.key === key)
          return variable ? `{{${variable.parameter}}}` : token
        }
      ) ?? ''
    )
  }
  return [
    '# Request a change template review',
    '',
    'Database state only; not evidence of fresh provider approval. Image plans are not submissions.',
    '',
    ...page.variants.flatMap((v) => [
      `## ${v.parent_key}`,
      '',
      `Key: ${v.key ?? 'missing'}`,
      `State: ${v.state}; review: ${v.review_status ?? 'none'}; active: ${v.active}`,
      `Identity: ${v.content?.templateName ?? 'missing'} [${v.content?.languageCode ?? v.language}]`,
      `Category: ${v.content?.category ?? 'unknown'}; format: ${v.content?.parameterFormat ?? 'unknown'}`,
      `Image twin: ${v.image_twin.key}; ${v.image_twin.template_name}; ${v.image_twin.state}; IMAGE; parent: ${v.key}`,
      ...(v.content
        ? [
            '',
            '```text',
            v.content.body,
            '```',
            '',
            'Provider body (exact parameter syntax):',
            '```text',
            providerBody(v),
            '```',
            '',
            `Buttons: ${v.content.confirmLabel} → ${v.content.cancelLabel} → ${v.content.changeLabel}`,
            '',
            '```json',
            JSON.stringify(
              v.validation?.variables ?? v.content.samples,
              null,
              2
            ),
            '```',
          ]
        : []),
      '',
    ]),
    'Manual Meta adoption: use these exact provider names, language codes, parameter formats, body and button order. Image twins repeat the text parent plus an IMAGE header. Reconcile the exact name-language identity through authorized admin tools; never fabricate provider IDs or approval.',
    '',
    'Merchant-owned sending supports independently approved text copies only. Shared-number image creation uploads/submits to Meta and requires separate authorization.',
  ].join('\n')
}
