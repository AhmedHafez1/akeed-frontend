import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ar from '../../../public/messages/ar.json'
import en from '../../../public/messages/en.json'
import { AdminShell } from './AdminShell'
import { renderAdmin } from './adminTemplatesTestUtils'

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key)
  )
}

/** Every refusal code the template routes answer with (backend E08). */
const BACKEND_CODES = [
  'ADMIN_TEMPLATE_METRICS_RANGE_INVALID',
  'WHATSAPP_TEMPLATE_OPERATIONS_DISABLED',
  'WHATSAPP_TEMPLATE_OPERATOR_REQUIRED',
  'WHATSAPP_TEMPLATE_SYNC_DISABLED',
  'WHATSAPP_TEMPLATE_SYNC_IN_PROGRESS',
  'WHATSAPP_TEMPLATE_SYNC_COOLDOWN',
  'WHATSAPP_TEMPLATE_NOT_FOUND',
  'WHATSAPP_TEMPLATE_NOT_SENDABLE',
  'WHATSAPP_TEMPLATE_TEST_SEND_DISABLED',
  'WHATSAPP_TEMPLATE_TEST_PHONE_NOT_ALLOWED',
  'WHATSAPP_TEMPLATE_TEST_COOLDOWN',
  'WHATSAPP_TEMPLATE_TEST_DAILY_LIMIT',
  'WHATSAPP_TEMPLATE_TEST_SEND_FAILED',
  'WHATSAPP_TEMPLATE_DRAFT_NOT_FOUND',
  'WHATSAPP_TEMPLATE_DRAFT_NOT_EDITABLE',
  'WHATSAPP_TEMPLATE_DRAFT_NAME_TAKEN',
  'WHATSAPP_TEMPLATE_DRAFT_INVALID',
  'WHATSAPP_TEMPLATE_SUBMIT_IN_PROGRESS',
  'WHATSAPP_TEMPLATE_SUBMIT_UNRESOLVED',
  'WHATSAPP_TEMPLATE_SUBMIT_REJECTED',
  'WHATSAPP_TEMPLATE_PROVIDER_UNAVAILABLE',
  'WHATSAPP_TEMPLATE_RECONCILE_NOT_NEEDED',
  'WHATSAPP_TEMPLATE_EDIT_REFUSED',
  'WHATSAPP_TEMPLATE_EDIT_REJECTED',
  'WHATSAPP_TEMPLATE_EDIT_UNRESOLVED',
  'WHATSAPP_TEMPLATE_RETIRED',
  'WHATSAPP_TEMPLATE_NOT_APPROVED',
  'WHATSAPP_TEMPLATE_NOT_ACTIVE',
  'WHATSAPP_TEMPLATE_REPLACEMENT_REQUIRED',
  'WHATSAPP_TEMPLATE_REPLACEMENT_INVALID',
] as const

/** Every neutral review status the backend can return. */
const REVIEW_STATUSES = [
  'approved',
  'pending',
  'rejected',
  'paused',
  'disabled',
  'in_appeal',
  'limit_exceeded',
  'pending_deletion',
  'deleted',
  'archived',
  'flagged',
  'locked',
  'reinstated',
  'unarchived',
  'missing',
  'unknown',
  'not_synced',
] as const

/** Every rule `template-draft.validation.ts` can report (backend US-08-06). */
const VALIDATION_RULES = [
  'style_format',
  'name_format',
  'name_convention',
  'name_taken',
  'language_code_unsupported',
  'category_not_allowed',
  'body_required',
  'body_too_long',
  'variable_unknown',
  'braces_mismatched',
  'parameter_at_edge',
  'parameter_ratio',
  'mapping_incomplete',
  'parameter_name_format',
  'parameter_numbering',
  'sample_missing',
  'sample_multiline',
  'filled_body_too_long',
  'button_label_required',
  'button_label_too_long',
  'button_labels_identical',
  'button_count',
  'button_order',
] as const

/** `TemplateSubmissionErrorCode` in the backend's template catalog port. */
const SUBMISSION_ERROR_CODES = [
  'not_configured',
  'auth_failed',
  'permission_denied',
  'rate_limited',
  'invalid_parameter',
  'character_limit',
  'format_rejected',
  'parameter_ratio',
  'parameter_at_edge',
  'integrity_blocked',
  'status_locked',
  'provider_error',
  'unresolved',
] as const

const REJECTION_REASONS = [
  'abusive_content',
  'incorrect_category',
  'invalid_format',
  'promotional',
  'scam',
  'tag_content_mismatch',
  'none',
  'unknown',
] as const

const EDIT_REFUSALS = [
  'retired',
  'not_authored_here',
  'status_not_editable',
  'in_use',
  'daily_limit',
  'monthly_limit',
] as const

describe('adminTemplates messages', () => {
  it('has the same keys in Arabic and English, none of them empty', () => {
    expect(keysOf(ar.adminTemplates).sort()).toEqual(
      keysOf(en.adminTemplates).sort()
    )
    for (const messages of [ar.adminTemplates, en.adminTemplates]) {
      const text = JSON.stringify(messages)
      expect(text).not.toContain('""')
    }
  })

  it('translates every backend refusal code and every review status', () => {
    for (const messages of [ar.adminTemplates, en.adminTemplates]) {
      expect(Object.keys(messages.errors)).toEqual(
        expect.arrayContaining([...BACKEND_CODES])
      )
      expect(Object.keys(messages.status).sort()).toEqual(
        [...REVIEW_STATUSES].sort()
      )
    }
  })

  it('translates every validation rule, refusal reason and draft state the backend sends', () => {
    for (const messages of [ar.adminTemplates, en.adminTemplates]) {
      expect(Object.keys(messages.validation.rules).sort()).toEqual(
        [...VALIDATION_RULES].sort()
      )
      expect(Object.keys(messages.submitReasons)).toEqual(
        expect.arrayContaining([...SUBMISSION_ERROR_CODES])
      )
      expect(Object.keys(messages.rejection).sort()).toEqual(
        [...REJECTION_REASONS].sort()
      )
      expect(Object.keys(messages.editRefusals).sort()).toEqual(
        [...EDIT_REFUSALS].sort()
      )
      expect(Object.keys(messages.draftState).sort()).toEqual(
        ['draft', 'submit_unknown', 'submitted', 'submitting'].sort()
      )
    }
  })

  it.each([
    ['en', 'Templates'],
    ['ar', 'القوالب'],
  ] as const)('adds Templates to the admin navigation in %s', (lang, name) => {
    renderAdmin(
      <AdminShell>
        <p>page</p>
      </AdminShell>,
      lang
    )

    expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(
      `/${lang}/admin/templates`
    )
  })
})
