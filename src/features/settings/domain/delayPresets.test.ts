import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ESCALATION_GAP_MINUTES,
  escalationGapFromStored,
  escalationStoredFromGap,
  hourPresetOptions,
  parseCustomDelayMinutes,
  REMINDER_PRESET_HOURS,
  sendDelayChoiceFor,
  sendDelayPresetMinutes,
} from './delayPresets'

describe('send-delay presets', () => {
  it.each([
    [0, 'now'],
    [15, 'after15m'],
    [60, 'after1h'],
    [30, 'custom'],
    [1440, 'custom'],
  ] as const)('maps %i stored minutes to %s', (minutes, choice) => {
    expect(sendDelayChoiceFor(minutes)).toBe(choice)
  })

  it('maps each preset back to the minutes it stores', () => {
    expect(sendDelayPresetMinutes('now')).toBe(0)
    expect(sendDelayPresetMinutes('after15m')).toBe(15)
    expect(sendDelayPresetMinutes('after1h')).toBe(60)
  })

  it.each([
    ['0', 0],
    ['45', 45],
    [' 90 ', 90],
    ['1440', 1440],
  ])('accepts custom value %j', (input, minutes) => {
    expect(parseCustomDelayMinutes(input)).toBe(minutes)
  })

  it.each(['', '-5', '1.5', '1441', 'abc', '99999'])(
    'rejects custom value %j',
    (input) => {
      expect(parseCustomDelayMinutes(input)).toBeNull()
    }
  )
})

describe('hour preset groups', () => {
  it('lists the presets when the saved value is one of them', () => {
    expect(
      hourPresetOptions(REMINDER_PRESET_HOURS, 360).map((o) => o.hours)
    ).toEqual([2, 6, 12, 24])
  })

  it('adds a pressed segment for a saved value that is not a preset', () => {
    const options = hourPresetOptions(REMINDER_PRESET_HOURS, 240)
    expect(options.map((o) => o.hours)).toEqual([2, 4, 6, 12, 24])
    expect(options.find((o) => o.minutes === 240)?.isExtra).toBe(true)
  })

  it('shows a fractional extra segment rather than rounding it away', () => {
    expect(
      hourPresetOptions(REMINDER_PRESET_HOURS, 90).find((o) => o.isExtra)?.hours
    ).toBe(1.5)
  })
})

describe('no-reply delay conversion', () => {
  it('shows the gap after the reminder when the reminder is on', () => {
    expect(
      escalationGapFromStored({
        escalationDelayMinutes: 360,
        followUpEnabled: true,
        followUpDelayMinutes: 120,
      })
    ).toBe(240)
  })

  it('shows the delay from the first message when the reminder is off', () => {
    expect(
      escalationGapFromStored({
        escalationDelayMinutes: 360,
        followUpEnabled: false,
        followUpDelayMinutes: 120,
      })
    ).toBe(360)
  })

  it('falls back when stored values give no positive gap', () => {
    expect(
      escalationGapFromStored({
        escalationDelayMinutes: 120,
        followUpEnabled: true,
        followUpDelayMinutes: 360,
      })
    ).toBe(120)
    expect(
      escalationGapFromStored({
        escalationDelayMinutes: 0,
        followUpEnabled: false,
        followUpDelayMinutes: 0,
      })
    ).toBe(DEFAULT_ESCALATION_GAP_MINUTES)
  })

  it('stores reminder + gap, counted from the first message', () => {
    expect(
      escalationStoredFromGap({
        gapMinutes: 720,
        followUpEnabled: true,
        followUpDelayMinutes: 360,
      })
    ).toBe(1080)
    expect(
      escalationStoredFromGap({
        gapMinutes: 720,
        followUpEnabled: false,
        followUpDelayMinutes: 360,
      })
    ).toBe(720)
  })

  it('round-trips through the stored value', () => {
    const stored = escalationStoredFromGap({
      gapMinutes: 1440,
      followUpEnabled: true,
      followUpDelayMinutes: 120,
    })
    expect(
      escalationGapFromStored({
        escalationDelayMinutes: stored,
        followUpEnabled: true,
        followUpDelayMinutes: 120,
      })
    ).toBe(1440)
  })
})
