import { describe, expect, it } from 'vitest'
import { settingsResponseFixture } from '../testing/settingsFixture'
import {
  dirtyTabs,
  fieldErrorFromApiCode,
  firstInvalidField,
  formFromSettings,
  suggestedTimezoneOnEnable,
  toSettingsPayload,
  validateSettingsForm,
} from './settingsForm'

function formFor(state: Parameters<typeof settingsResponseFixture>[0] = {}) {
  const response = settingsResponseFixture(state)
  return formFromSettings(response.state, response.template)
}

describe('formFromSettings / toSettingsPayload', () => {
  it('maps stored minutes to presets and back without changing them', () => {
    const form = formFor()
    expect(form.sendDelayChoice).toBe('now')
    // 1080 stored from the first message, reminder at 360 → 12 h after it.
    expect(form.escalationGapMinutes).toBe(720)

    const payload = toSettingsPayload(form)
    expect(payload).toMatchObject({
      storeName: 'Togo_Test_A',
      sendDelayMinutes: 0,
      followUpDelayMinutes: 360,
      escalationDelayMinutes: 1080,
      quietHoursStart: '21:00',
      quietHoursEnd: '09:00',
      timezone: 'Africa/Cairo',
      codTemplateArVariant: 'standard',
      codTemplateEnVariant: 'friendly',
    })
  })

  it('opens "custom" for a saved delay that matches no preset', () => {
    const form = formFor({ state: { sendDelayMinutes: 30 } })
    expect(form.sendDelayChoice).toBe('custom')
    expect(form.sendDelayCustom).toBe('30')
    expect(toSettingsPayload(form).sendDelayMinutes).toBe(30)
  })

  it('stores 15 minutes as 15', () => {
    const form = { ...formFor(), sendDelayChoice: 'after15m' as const }
    expect(toSettingsPayload(form).sendDelayMinutes).toBe(15)
  })

  it('keeps the visible alert gap when the reminder is switched off', () => {
    const form = { ...formFor(), followUpEnabled: false }
    expect(toSettingsPayload(form).escalationDelayMinutes).toBe(720)
  })

  it('trims the store name', () => {
    expect(
      toSettingsPayload({ ...formFor(), storeName: '  My Store ' }).storeName
    ).toBe('My Store')
  })
})

describe('dirtyTabs', () => {
  it('is empty for an untouched form', () => {
    const form = formFor()
    expect(dirtyTabs(form, form).size).toBe(0)
  })

  it('attributes message and timing changes to their tabs', () => {
    const saved = formFor()
    expect([...dirtyTabs({ ...saved, storeName: 'New' }, saved)]).toEqual([
      'message',
    ])
    expect([
      ...dirtyTabs(
        {
          ...saved,
          codTemplateVariants: { ...saved.codTemplateVariants, ar: 'gulf' },
        },
        saved
      ),
    ]).toEqual(['message'])
    expect([...dirtyTabs({ ...saved, quietHoursEnd: '08:00' }, saved)]).toEqual(
      ['timing']
    )
  })

  it('ignores a UI-only switch to "custom" with the same minutes', () => {
    const saved = formFor()
    const current = {
      ...saved,
      sendDelayChoice: 'custom' as const,
      sendDelayCustom: '0',
    }
    expect(dirtyTabs(current, saved).size).toBe(0)
  })

  it('counts an invalid custom value as an unsaved timing change', () => {
    const saved = formFor()
    const current = {
      ...saved,
      sendDelayChoice: 'custom' as const,
      sendDelayCustom: '',
    }
    expect([...dirtyTabs(current, saved)]).toEqual(['timing'])
  })
})

describe('validateSettingsForm', () => {
  it('passes a valid form', () => {
    expect(validateSettingsForm(formFor())).toEqual({})
  })

  it('requires a store name and caps its length', () => {
    expect(validateSettingsForm({ ...formFor(), storeName: '  ' })).toEqual({
      storeName: 'required',
    })
    expect(
      validateSettingsForm({ ...formFor(), storeName: 'x'.repeat(61) })
    ).toEqual({ storeName: 'tooLong' })
  })

  it('rejects an invalid custom delay only while sending is on', () => {
    const invalid = {
      ...formFor(),
      sendDelayChoice: 'custom' as const,
      sendDelayCustom: '2000',
    }
    expect(validateSettingsForm(invalid)).toEqual({
      sendDelayCustom: 'invalidDelay',
    })
    expect(
      validateSettingsForm({ ...invalid, isAutoVerifyEnabled: false })
    ).toEqual({})
  })

  it('rejects start = end and picks the first invalid field in page order', () => {
    const errors = validateSettingsForm({
      ...formFor(),
      storeName: '',
      quietHoursEnd: '21:00',
    })
    expect(errors).toEqual({
      storeName: 'required',
      quietHours: 'sameStartEnd',
    })
    expect(firstInvalidField(errors)).toBe('storeName')
  })
})

describe('server error codes', () => {
  it('maps known codes to fields', () => {
    expect(fieldErrorFromApiCode('SETTINGS_TIMEZONE_UNSUPPORTED')).toEqual({
      timezone: 'unsupportedTimezone',
    })
    expect(fieldErrorFromApiCode('SETTINGS_QUIET_HOURS_EMPTY_WINDOW')).toEqual({
      quietHours: 'sameStartEnd',
    })
    expect(fieldErrorFromApiCode('SOMETHING_ELSE')).toBeNull()
  })
})

describe('suggestedTimezoneOnEnable', () => {
  const neverChosen = formFor({
    state: {
      quietHoursEnabled: false,
      timezone: 'Asia/Riyadh',
      shopTimezone: 'Europe/Istanbul',
    },
  })

  it('suggests the store zone for a store still on the default', () => {
    expect(
      suggestedTimezoneOnEnable({
        saved: neverChosen,
        current: neverChosen,
        shopTimezone: 'Europe/Istanbul',
      })
    ).toBe('Europe/Istanbul')
  })

  it('keeps a zone the merchant already chose', () => {
    expect(
      suggestedTimezoneOnEnable({
        saved: { ...neverChosen, timezone: 'Asia/Dubai' },
        current: { ...neverChosen, timezone: 'Asia/Dubai' },
        shopTimezone: 'Europe/Istanbul',
      })
    ).toBeNull()
    expect(
      suggestedTimezoneOnEnable({
        saved: neverChosen,
        current: { ...neverChosen, timezone: 'Asia/Qatar' },
        shopTimezone: 'Europe/Istanbul',
      })
    ).toBeNull()
  })
})
