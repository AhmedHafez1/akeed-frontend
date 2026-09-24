import { describe, expect, it } from 'vitest'
import {
  crossesMidnight,
  quietTimeParts,
  quietTimeValues,
  validateQuietHours,
} from './quietHours'

describe('validateQuietHours', () => {
  it('accepts a window that crosses midnight', () => {
    expect(
      validateQuietHours({ enabled: true, start: '21:00', end: '09:00' })
    ).toBeNull()
    expect(crossesMidnight('21:00', '09:00')).toBe(true)
  })

  it('accepts a same-day window', () => {
    expect(
      validateQuietHours({ enabled: true, start: '13:00', end: '15:30' })
    ).toBeNull()
    expect(crossesMidnight('13:00', '15:30')).toBe(false)
  })

  it('rejects start = end', () => {
    expect(
      validateQuietHours({ enabled: true, start: '21:00', end: '21:00' })
    ).toBe('sameStartEnd')
  })

  it('rejects malformed times', () => {
    expect(
      validateQuietHours({ enabled: true, start: '25:00', end: '09:00' })
    ).toBe('invalidTime')
  })

  it('ignores the window while quiet hours are off', () => {
    expect(
      validateQuietHours({ enabled: false, start: '21:00', end: '21:00' })
    ).toBeNull()
  })
})

describe('quiet time options', () => {
  it('offers every 30 minutes of the day', () => {
    const values = quietTimeValues()
    expect(values).toHaveLength(48)
    expect(values[0]).toBe('00:00')
    expect(values[1]).toBe('00:30')
    expect(values.at(-1)).toBe('23:30')
  })

  it('keeps an off-grid saved value selectable', () => {
    const values = quietTimeValues('22:15', '09:00')
    expect(values).toHaveLength(49)
    expect(values).toContain('22:15')
  })

  it.each([
    ['00:00', 12, '00', 'am'],
    ['09:00', 9, '00', 'am'],
    ['12:30', 12, '30', 'pm'],
    ['21:00', 9, '00', 'pm'],
  ] as const)(
    'splits %s into 12-hour parts',
    (value, hour12, minute, period) => {
      expect(quietTimeParts(value)).toEqual({ hour12, minute, period })
    }
  )
})
