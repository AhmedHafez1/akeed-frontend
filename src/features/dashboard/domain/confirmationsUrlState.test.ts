import { describe, expect, it } from 'vitest'
import {
  legacyStatusToTab,
  rangeParam,
  resolveConfirmationsTab,
  resolveDashboardRange,
} from './confirmationsUrlState'

describe('resolveDashboardRange', () => {
  it('keeps a known range and falls back to the last 30 days', () => {
    expect(resolveDashboardRange('today')).toBe('today')
    expect(resolveDashboardRange('last_7_days')).toBe('last_7_days')
    expect(resolveDashboardRange('forever')).toBe('last_30_days')
    expect(resolveDashboardRange(null)).toBe('last_30_days')
  })

  it('leaves the default range out of the URL', () => {
    expect(rangeParam('last_30_days')).toBeNull()
    expect(rangeParam('today')).toBe('today')
  })
})

describe('resolveConfirmationsTab', () => {
  it('keeps a known tab and falls back to all', () => {
    expect(resolveConfirmationsTab('needs_action')).toBe('needs_action')
    expect(resolveConfirmationsTab('in_progress')).toBe('all')
    expect(resolveConfirmationsTab(undefined)).toBe('all')
  })
})

describe('legacyStatusToTab', () => {
  it('sends old outcome links to the matching tab', () => {
    expect(legacyStatusToTab('needs_attention')).toBe('needs_action')
    expect(legacyStatusToTab('no_reply')).toBe('needs_action')
    expect(legacyStatusToTab('confirmed')).toBe('confirmed')
    expect(legacyStatusToTab('canceled')).toBe('canceled')
    expect(legacyStatusToTab('failed')).toBe('failed')
  })

  it('opens everything for a status no tab stands for', () => {
    expect(legacyStatusToTab('in_progress')).toBe('all')
    expect(legacyStatusToTab('pending')).toBe('all')
    expect(legacyStatusToTab(null)).toBe('all')
  })
})
