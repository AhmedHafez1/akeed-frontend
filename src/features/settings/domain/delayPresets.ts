/**
 * Preset delays on the Timing tab and their mapping to the stored minutes.
 *
 * Every delay is stored in whole minutes (`integrations.*_delay_minutes`).
 * The no-reply delay is stored from the FIRST message, which is what the
 * scheduler reads; the tab shows it relative to the reminder when the reminder
 * is on, so the conversion lives here and nowhere else.
 */

export const SEND_DELAY_PRESETS = [
  { id: 'now', minutes: 0 },
  { id: 'after15m', minutes: 15 },
  { id: 'after1h', minutes: 60 },
] as const

export type SendDelayPresetId = (typeof SEND_DELAY_PRESETS)[number]['id']
export type SendDelayChoice = SendDelayPresetId | 'custom'

export const SEND_DELAY_MAX_MINUTES = 1440

export const REMINDER_PRESET_HOURS = [2, 6, 12, 24] as const
export const ESCALATION_PRESET_HOURS = [6, 12, 24, 48] as const

/** Used when stored values are inconsistent and give a gap of zero or less. */
export const DEFAULT_ESCALATION_GAP_MINUTES = 12 * 60

export function sendDelayChoiceFor(minutes: number): SendDelayChoice {
  return (
    SEND_DELAY_PRESETS.find((preset) => preset.minutes === minutes)?.id ??
    'custom'
  )
}

export function sendDelayPresetMinutes(id: SendDelayPresetId): number {
  return SEND_DELAY_PRESETS.find((preset) => preset.id === id)?.minutes ?? 0
}

/** Parses the custom-delay field; whole minutes from 0 to 1440, else null. */
export function parseCustomDelayMinutes(input: string): number | null {
  const trimmed = input.trim()
  if (!/^\d{1,4}$/.test(trimmed)) return null
  const minutes = Number.parseInt(trimmed, 10)
  return minutes <= SEND_DELAY_MAX_MINUTES ? minutes : null
}

export interface HourPresetOption {
  minutes: number
  hours: number
  /** A saved value that matches no preset, shown so it is not lost. */
  isExtra: boolean
}

/**
 * The segments of an hours group. A stored value that is not a preset gets
 * its own pressed segment instead of being silently rounded.
 */
export function hourPresetOptions(
  presetHours: readonly number[],
  currentMinutes: number
): HourPresetOption[] {
  const options: HourPresetOption[] = presetHours.map((hours) => ({
    minutes: hours * 60,
    hours,
    isExtra: false,
  }))
  if (
    currentMinutes > 0 &&
    !options.some((option) => option.minutes === currentMinutes)
  ) {
    options.push({
      minutes: currentMinutes,
      hours: Math.round((currentMinutes / 60) * 100) / 100,
      isExtra: true,
    })
    options.sort((a, b) => a.minutes - b.minutes)
  }
  return options
}

/** Stored no-reply delay → the gap the tab shows. */
export function escalationGapFromStored(params: {
  escalationDelayMinutes: number
  followUpEnabled: boolean
  followUpDelayMinutes: number
}): number {
  const gap = params.followUpEnabled
    ? params.escalationDelayMinutes - params.followUpDelayMinutes
    : params.escalationDelayMinutes
  if (gap > 0) return gap
  return params.escalationDelayMinutes > 0
    ? params.escalationDelayMinutes
    : DEFAULT_ESCALATION_GAP_MINUTES
}

/** The gap the tab shows → the no-reply delay the scheduler reads. */
export function escalationStoredFromGap(params: {
  gapMinutes: number
  followUpEnabled: boolean
  followUpDelayMinutes: number
}): number {
  return params.followUpEnabled
    ? params.followUpDelayMinutes + params.gapMinutes
    : params.gapMinutes
}
