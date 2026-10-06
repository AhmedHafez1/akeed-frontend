import { describe, expect, it } from 'vitest'
import {
  draftStateTone,
  draftToForm,
  draftVariables,
  emptyDraftForm,
  insertVariable,
  issuesFor,
  previewDraft,
  type TemplateDraftForm,
  type TemplateVariableName,
} from './admin-template-drafts.model'
import { authoringContext, templateDraft } from './adminTemplatesTestUtils'

const VARIABLES: TemplateVariableName[] = [
  'customer',
  'store',
  'order',
  'total',
]

function form(overrides: Partial<TemplateDraftForm> = {}): TemplateDraftForm {
  return { ...draftToForm(templateDraft()), ...overrides }
}

describe('template draft model', () => {
  it('starts a draft in a language with its first code and its sample values', () => {
    expect(emptyDraftForm(authoringContext(), 'en')).toEqual({
      purpose: 'cod_confirmation',
      language: 'en',
      style: '',
      language_code: 'en',
      parameter_format: 'named',
      body: '',
      confirm_label: '',
      cancel_label: '',
      samples: {
        customer: 'Ahmed',
        store: 'Akeed Store',
        order: 'TEST-1',
        total: '250.00 USD',
      },
    })
    expect(emptyDraftForm(authoringContext()).language).toBe('ar')
  })

  it('reads the supported values of a body in first-use order, once each', () => {
    expect(
      draftVariables(
        'Order {{order}} for {{ customer }}, total {{total}}, again {{order}} {{items}}',
        VARIABLES
      )
    ).toEqual(['order', 'customer', 'total'])
  })

  it('fills the preview with samples, one paragraph per non-empty line', () => {
    expect(
      previewDraft(
        form({
          body: 'Hello {{customer}},\n\n  Order {{order}} from {{store}}.  \n',
          samples: { customer: 'Ahmed', order: 'TEST-1' },
        })
      )
    ).toEqual({
      // A value with no sample yet stays visible as its placeholder.
      paragraphs: ['Hello Ahmed,', 'Order TEST-1 from {{store}}.'],
      buttons: [
        { label: 'Confirm order', kind: 'quick_reply' },
        { label: 'Cancel order', kind: 'quick_reply' },
      ],
      direction: 'ltr',
    })
  })

  it('previews an Arabic draft right to left and leaves out an unwritten button', () => {
    const preview = previewDraft(
      form({ language: 'ar', body: 'أهلاً', cancel_label: ' ' })
    )

    expect(preview.direction).toBe('rtl')
    expect(preview.buttons).toEqual([
      { label: 'Confirm order', kind: 'quick_reply' },
    ])
  })

  it('inserts a value at the caret, or over the selection', () => {
    expect(insertVariable('Hello , hi', 'customer', 6, 6)).toEqual({
      body: 'Hello {{customer}}, hi',
      caret: 18,
    })
    expect(insertVariable('Order XXXX now', 'order', 6, 10)).toEqual({
      body: 'Order {{order}} now',
      caret: 15,
    })
  })

  it('gives each field its own findings, errors before warnings', () => {
    const validation = {
      valid: false,
      issues: [
        {
          field: 'body',
          rule: 'parameter_ratio',
          finding: '4.6.14',
          severity: 'warning' as const,
        },
        {
          field: 'style',
          rule: 'style_format',
          finding: 'akeed',
          severity: 'error' as const,
        },
        {
          field: 'body',
          rule: 'body_too_long',
          finding: '4.6.7',
          severity: 'error' as const,
        },
      ],
    }

    expect(
      issuesFor(validation, ['body', 'variables']).map((issue) => issue.rule)
    ).toEqual(['body_too_long', 'parameter_ratio'])
    expect(issuesFor(null, ['body'])).toEqual([])
  })

  it('colours a draft state by how much attention it needs', () => {
    expect(draftStateTone('draft')).toBe('outline')
    expect(draftStateTone('submitting')).toBe('warning')
    expect(draftStateTone('submit_unknown')).toBe('danger')
    expect(draftStateTone('submitted')).toBe('success')
  })
})
