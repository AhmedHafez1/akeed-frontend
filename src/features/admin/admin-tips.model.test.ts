import { describe, expect, it } from 'vitest'
import {
  addTipLocale,
  emptyTipForm,
  externalUrlIssue,
  removeTipLocale,
  tipDraftPayload,
  tipIssuesFromApi,
  validateTipForm,
  type TipForm,
} from './admin-tips.model'

const NOW = new Date('2026-10-25T12:00:00Z')

function filled(overrides: Partial<TipForm> = {}): TipForm {
  const form = emptyTipForm()
  return {
    ...form,
    name: 'Quiet hours tip',
    content: {
      en: { title: 'Quiet hours', description: 'Hold sends.', actionLabel: '' },
    },
    ...overrides,
  }
}

describe('validateTipForm', () => {
  it('requires a name and complete English content', () => {
    expect(validateTipForm(emptyTipForm(), { now: NOW })).toEqual({
      name: 'required',
      'title.en': 'required',
      'description.en': 'required',
    })
  })

  it('requires every added language to be complete, with a button label when there is a button', () => {
    const form = addTipLocale(
      filled({ actionKind: 'internal', actionRoute: 'settings_timing' }),
      'ar'
    )
    expect(validateTipForm(form, { now: NOW })).toEqual({
      'action_label.en': 'required',
      'title.ar': 'required',
      'description.ar': 'required',
      'action_label.ar': 'required',
    })
  })

  it('checks limits, line breaks, links and expiry', () => {
    const issues = validateTipForm(
      filled({
        content: {
          en: {
            title: 'a\nb\nc',
            description: 'x'.repeat(501),
            actionLabel: '',
          },
        },
        actionKind: 'external',
        actionUrl: 'javascript:alert(1)',
        expiresLocal: '2026-01-01T00:00',
      }),
      { now: NOW }
    )
    expect(issues).toEqual({
      'title.en': 'too_many_lines',
      'description.en': 'too_long',
      'action_label.en': 'required',
      'action.url': 'url_not_https',
      expires_at: 'expiry_in_past',
    })
  })

  it('skips the expiry check for published content edits', () => {
    expect(
      validateTipForm(filled({ expiresLocal: '2026-01-01T00:00' }), {
        now: NOW,
        checkExpiry: false,
      })
    ).toEqual({})
  })
})

describe('externalUrlIssue', () => {
  it.each([
    ['https://akeed.app/docs', null],
    ['//evil.example.com', 'url_not_https'],
    ['https://localhost/x', 'invalid_url'],
    ['https://user:pw@akeed.app', 'invalid_url'],
  ])('%s → %s', (url, expected) => {
    expect(externalUrlIssue(url)).toBe(expected)
  })
})

describe('form helpers', () => {
  it('keeps English and orders languages', () => {
    const form = addTipLocale(addTipLocale(filled(), 'tr'), 'ar')
    expect(form.locales).toEqual(['en', 'ar', 'tr'])
    expect(removeTipLocale(form, 'en').locales).toEqual(['en', 'ar', 'tr'])
    expect(removeTipLocale(form, 'ar').locales).toEqual(['en', 'tr'])
  })

  it('sends labels only with a button, and the expiry as a UTC instant', () => {
    const payload = tipDraftPayload(
      filled({
        content: { en: { title: 'T', description: 'D', actionLabel: 'stale' } },
        expiresLocal: '2026-11-01T09:30',
      })
    )
    expect(payload.translations[0].action_label).toBeNull()
    expect(payload.action).toBeNull()
    expect(payload.expires_at).toBe(new Date('2026-11-01T09:30').toISOString())
  })

  it('reads the backend findings into the same keys', () => {
    expect(
      tipIssuesFromApi({
        issues: [
          { field: 'title', code: 'required', locale: 'ar' },
          { field: 'action.url', code: 'url_not_https' },
        ],
      })
    ).toEqual({ 'title.ar': 'required', 'action.url': 'url_not_https' })
  })
})
