import { describe, expect, it } from 'vitest'
import {
  isCanonicalSettingsTab,
  isCanonicalStandaloneSettingsUrl,
  resolveSettingsTab,
  resolveStandaloneSettingsTab,
} from './settingsTabs'

describe('resolveStandaloneSettingsTab', () => {
  it.each([
    [{}, 'message'],
    [{ tab: null, section: null }, 'message'],
    [{ tab: 'message' }, 'message'],
    [{ tab: 'timing' }, 'timing'],
    [{ tab: 'store' }, 'store'],
    // The previous layout's `?section=` ids.
    [{ section: 'general' }, 'message'],
    [{ section: 'automation' }, 'timing'],
    // Ids shared with the embedded app and the old Templates page.
    [{ tab: 'automation' }, 'timing'],
    [{ tab: 'confirmation' }, 'timing'],
    [{ tab: 'templates' }, 'message'],
    [{ tab: 'message-preview' }, 'message'],
    [{ section: 'templates' }, 'message'],
    [{ tab: 'unknown' }, 'message'],
    [{ section: 'unknown' }, 'message'],
    // `?tab=` wins over a leftover `?section=`.
    [{ tab: 'store', section: 'automation' }, 'store'],
    [{ tab: 'timing', section: 'billing' }, 'timing'],
    [{ tab: '', section: 'automation' }, 'timing'],
  ] as const)('opens %o on the %s tab', (params, tab) => {
    expect(resolveStandaloneSettingsTab(params)).toEqual({ kind: 'tab', tab })
  })

  it.each([
    [{ section: 'billing' }],
    [{ tab: 'billing' }],
    [{ tab: 'plan' }],
    [{ tab: 'plan', section: 'general' }],
  ] as const)('sends %o to the billing page', (params) => {
    expect(resolveStandaloneSettingsTab(params)).toEqual({ kind: 'billing' })
  })
})

describe('isCanonicalStandaloneSettingsUrl', () => {
  it.each([
    [{}, true],
    [{ tab: null, section: null }, true],
    [{ tab: 'message' }, true],
    [{ tab: 'store' }, true],
    // Legacy ids, the billing aliases and any `?section=` get rewritten.
    [{ tab: 'templates' }, false],
    [{ tab: 'plan' }, false],
    [{ tab: '' }, false],
    [{ section: 'general' }, false],
    [{ tab: 'timing', section: 'automation' }, false],
  ] as const)('reports %o as canonical: %s', (params, canonical) => {
    expect(isCanonicalStandaloneSettingsUrl(params)).toBe(canonical)
  })
})

describe('resolveSettingsTab', () => {
  it.each([
    [null, 'message'],
    ['message', 'message'],
    ['timing', 'timing'],
    ['plan', 'plan'],
    // The four-tab layout and older ids keep landing on their fields.
    ['store', 'message'],
    ['settings', 'message'],
    ['message-preview', 'message'],
    ['message-template', 'message'],
    ['confirmation', 'timing'],
    ['confirmation-config', 'timing'],
    ['billing', 'plan'],
    ['unknown', 'message'],
  ] as const)('maps %s to %s', (param, tab) => {
    expect(resolveSettingsTab(param)).toBe(tab)
  })

  it('only treats current ids (or none) as canonical', () => {
    expect(isCanonicalSettingsTab(null)).toBe(true)
    expect(isCanonicalSettingsTab('timing')).toBe(true)
    expect(isCanonicalSettingsTab('billing')).toBe(false)
    expect(isCanonicalSettingsTab('store')).toBe(false)
  })
})
