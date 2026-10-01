import { describe, expect, it } from 'vitest'
import {
  buildTimezoneOptions,
  CURATED_TIMEZONES,
  timezonePlaceName,
} from './timezoneOptions'

const build = (
  shopTimezone: string | null,
  currentTimezone: string | null = null
) =>
  buildTimezoneOptions({
    shopTimezone,
    currentTimezone,
    curatedLabel: (zone) => `curated:${zone}`,
    storeTimeLabel: (label) => `${label} (store)`,
  })

describe('buildTimezoneOptions', () => {
  it('lists the curated zones in order when there is no store zone', () => {
    const options = build(null, 'Asia/Riyadh')

    expect(options.map((option) => option.value)).toEqual([
      ...CURATED_TIMEZONES,
    ])
    expect(options[0].label).toBe('curated:Asia/Riyadh')
  })

  it('puts the store zone first, once, marked as store time', () => {
    const options = build('Africa/Cairo', 'Africa/Cairo')

    expect(options[0]).toEqual({
      value: 'Africa/Cairo',
      label: 'curated:Africa/Cairo (store)',
    })
    expect(
      options.filter((option) => option.value === 'Africa/Cairo')
    ).toHaveLength(1)
    expect(options).toHaveLength(CURATED_TIMEZONES.length)
  })

  it('names a store zone outside the list by its place', () => {
    const options = build('America/New_York')

    expect(options[0]).toEqual({
      value: 'America/New_York',
      label: 'New York (store)',
    })
    expect(options).toHaveLength(CURATED_TIMEZONES.length + 1)
  })

  it('keeps a saved zone that is in neither list', () => {
    const options = build('Africa/Cairo', 'Europe/Istanbul')

    expect(options.at(-1)).toEqual({
      value: 'Europe/Istanbul',
      label: 'Istanbul',
    })
  })
})

describe('timezonePlaceName', () => {
  it('reads the last segment with spaces', () => {
    expect(timezonePlaceName('America/Argentina/Buenos_Aires')).toBe(
      'Buenos Aires'
    )
    expect(timezonePlaceName('UTC')).toBe('UTC')
  })
})
