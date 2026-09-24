/**
 * Quiet-hours times and validation for the Timing tab.
 *
 * Times travel as `HH:mm` (what the API stores). The window is `[start, end)`
 * in the store's chosen zone and may cross midnight; messages due inside it
 * are sent at `end`. A window whose start equals its end is empty and invalid.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const STEP_MINUTES = 30

export type QuietHoursError = 'invalidTime' | 'sameStartEnd'

export function isValidQuietTime(value: string): boolean {
  return TIME_PATTERN.test(value)
}

export function validateQuietHours(params: {
  enabled: boolean
  start: string
  end: string
}): QuietHoursError | null {
  if (!params.enabled) return null
  if (!isValidQuietTime(params.start) || !isValidQuietTime(params.end)) {
    return 'invalidTime'
  }
  return params.start === params.end ? 'sameStartEnd' : null
}

/** True when the window wraps past midnight (e.g. 21:00 → 09:00). */
export function crossesMidnight(start: string, end: string): boolean {
  return start > end
}

export interface QuietTimeParts {
  hour12: number
  minute: string
  period: 'am' | 'pm'
}

export function quietTimeParts(value: string): QuietTimeParts {
  const [hourText, minute] = value.split(':')
  const hour = Number.parseInt(hourText, 10)
  return {
    hour12: hour % 12 === 0 ? 12 : hour % 12,
    minute,
    period: hour < 12 ? 'am' : 'pm',
  }
}

/**
 * Every 30-minute step of the day, plus the saved values when they are off
 * the grid (for example a `22:15` set before the selects existed).
 */
export function quietTimeValues(...savedValues: string[]): string[] {
  const values = new Set<string>()
  for (let minutes = 0; minutes < 24 * 60; minutes += STEP_MINUTES) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
    const minute = String(minutes % 60).padStart(2, '0')
    values.add(`${hour}:${minute}`)
  }
  for (const value of savedValues) {
    if (isValidQuietTime(value)) values.add(value)
  }
  return [...values].sort()
}
