import { describe, expect, it } from 'vitest'
import { isCanonicalSettingsTab, resolveSettingsTab } from './settingsTabs'

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
