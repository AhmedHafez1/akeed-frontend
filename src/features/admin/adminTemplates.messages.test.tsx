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
