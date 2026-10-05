import { describe, expect, it } from 'vitest'
import {
  defaultTemplateRange,
  driftTone,
  emptyTemplateFilters,
  filterTemplates,
  isTemplateRangeValid,
  qualityTone,
  reviewStatusTone,
  templateFilterValues,
  templateRangeQuery,
  templateStatusKey,
} from './admin-templates.model'
import { templateSummary } from './adminTemplatesTestUtils'

const templates = [
  templateSummary(),
  templateSummary({
    key: 'cod_confirm.en.direct',
    language: 'en',
    style: 'direct',
    review_status: 'missing',
    is_default: false,
    sendable: false,
  }),
  templateSummary({
    key: 'cod_confirm.en.short',
    language: 'en',
    style: 'short',
    review_status: null,
    is_active: false,
    is_default: false,
  }),
]

describe('template date range', () => {
  it('defaults to the last 30 UTC days, today included', () => {
    expect(defaultTemplateRange(new Date('2026-10-05T23:30:00.000Z'))).toEqual({
      from: '2026-09-06',
      to: '2026-10-05',
    })
  })

  it('accepts ordered calendar dates only', () => {
    expect(isTemplateRangeValid({ from: '2026-10-01', to: '2026-10-01' })).toBe(
      true
    )
    expect(isTemplateRangeValid({ from: '2026-10-05', to: '2026-10-01' })).toBe(
      false
    )
    expect(isTemplateRangeValid({ from: '', to: '2026-10-01' })).toBe(false)
  })

  it('writes the range as the query the API reads', () => {
    expect(templateRangeQuery({ from: '2026-09-06', to: '2026-10-05' })).toBe(
      'from=2026-09-06&to=2026-10-05'
    )
  })
})

describe('template filters', () => {
  const keys = (filters: Partial<typeof emptyTemplateFilters>) =>
    filterTemplates(templates, { ...emptyTemplateFilters, ...filters }).map(
      (template) => template.key
    )

  it('keeps every template without a filter', () => {
    expect(keys({})).toHaveLength(3)
  })

  it('filters by language, status, active flag and purpose', () => {
    expect(keys({ language: 'en' })).toEqual([
      'cod_confirm.en.direct',
      'cod_confirm.en.short',
    ])
    expect(keys({ status: 'missing' })).toEqual(['cod_confirm.en.direct'])
    expect(keys({ status: 'not_synced' })).toEqual(['cod_confirm.en.short'])
    expect(keys({ active: 'inactive' })).toEqual(['cod_confirm.en.short'])
    expect(keys({ active: 'active', language: 'en' })).toEqual([
      'cod_confirm.en.direct',
    ])
    expect(keys({ purpose: 'order_update' })).toEqual([])
  })

  it('offers only the values the templates have', () => {
    expect(
      templateFilterValues(templates, (template) =>
        templateStatusKey(template.review_status)
      )
    ).toEqual(['approved', 'missing', 'not_synced'])
  })
})

describe('template tones', () => {
  it('reads approved as good, a review as a warning and the rest as blocking', () => {
    expect(reviewStatusTone('approved')).toBe('success')
    expect(reviewStatusTone('pending')).toBe('warning')
    expect(reviewStatusTone('paused')).toBe('danger')
    expect(reviewStatusTone('missing')).toBe('danger')
    expect(reviewStatusTone(null)).toBe('outline')
  })

  it('colours quality only once Meta has rated it', () => {
    expect(qualityTone('high')).toBe('success')
    expect(qualityTone('low')).toBe('danger')
    expect(qualityTone('pending')).toBe('outline')
  })

  it('treats a send difference and a missing template as worse than a text one', () => {
    expect(
      driftTone({ state: 'drift', kinds: ['body'], severity: 'preview' })
    ).toBe('warning')
    expect(
      driftTone({ state: 'drift', kinds: ['variables'], severity: 'send' })
    ).toBe('danger')
    expect(driftTone({ state: 'missing', kinds: [], severity: null })).toBe(
      'danger'
    )
    expect(driftTone({ state: 'in_sync', kinds: [], severity: null })).toBe(
      'success'
    )
    expect(driftTone({ state: 'not_synced', kinds: [], severity: null })).toBe(
      'outline'
    )
  })
})
