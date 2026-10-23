import { describe, expect, it } from 'vitest'
import {
  liveUrduSettingsFixture,
  SEEDED_STYLES,
  settingsResponseFixture,
} from '../testing/settingsFixture'
import {
  AUTO_CANCEL_SUGGESTED_MINUTES,
  autoCancelTogglePatch,
  dirtyTabs,
  escalationMinutesFromForm,
  escalationTogglePatch,
  fieldErrorFromApiCode,
  firstInvalidField,
  formFromSettings,
  sendDelayChoicePatch,
  suggestedTimezoneOnEnable,
  timelineInputFromForm,
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

  it.each([
    ...SEEDED_STYLES.ar.map((style) => ['ar', style] as const),
    ...SEEDED_STYLES.en.map((style) => ['en', style] as const),
    ['ar', 'a_style_added_later'] as const,
  ])('round-trips the %s style %s', (language, style) => {
    const response = settingsResponseFixture()
    const form = formFromSettings(response.state, {
      ...response.template,
      selected: { ...response.template.selected, [language]: style },
    })

    expect(form.codTemplateVariants[language]).toBe(style)
    expect(toSettingsPayload(form)).toMatchObject(
      language === 'ar'
        ? { codTemplateArVariant: style, codTemplateEnVariant: 'friendly' }
        : { codTemplateArVariant: 'standard', codTemplateEnVariant: style }
    )
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

  it('attributes the order-source default to the Store tab', () => {
    const saved = formFor()
    const current = { ...saved, assumeCodWhenPaymentMissing: true }
    expect([...dirtyTabs(current, saved)]).toEqual(['store'])
    expect(
      [...dirtyTabs({ ...current, storeName: 'New' }, saved)].sort()
    ).toEqual(['message', 'store'])
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

describe('sendDelayChoicePatch', () => {
  it('opens "custom" on the delay the form currently means', () => {
    const form = { ...formFor(), sendDelayChoice: 'after1h' as const }
    expect(sendDelayChoicePatch(form, 'custom')).toEqual({
      sendDelayChoice: 'custom',
      sendDelayCustom: '60',
    })
  })

  it('falls back to 0 when the custom value is not a valid delay', () => {
    const form = {
      ...formFor(),
      sendDelayChoice: 'custom' as const,
      sendDelayCustom: 'abc',
    }
    expect(sendDelayChoicePatch(form, 'custom').sendDelayCustom).toBe('0')
  })

  it('writes the minutes of a preset', () => {
    expect(sendDelayChoicePatch(formFor(), 'after15m')).toEqual({
      sendDelayChoice: 'after15m',
      sendDelayCustom: '15',
    })
  })
})

describe('timelineInputFromForm', () => {
  it('carries the gap the tab shows and the resolved send delay', () => {
    const input = timelineInputFromForm({
      ...formFor(),
      sendDelayChoice: 'after15m',
    })
    expect(input).toMatchObject({
      isAutoVerifyEnabled: true,
      sendDelayMinutes: 15,
      followUpDelayMinutes: 360,
      escalationGapMinutes: 720,
      quietHoursStart: '21:00',
      quietHoursEnd: '09:00',
    })
  })

  it('reports an invalid custom delay as null', () => {
    const input = timelineInputFromForm({
      ...formFor(),
      sendDelayChoice: 'custom',
      sendDelayCustom: '9999',
    })
    expect(input.sendDelayMinutes).toBeNull()
  })
})

describe('message languages in the payload', () => {
  it('sends no style for a language that is not live', () => {
    const payload = toSettingsPayload(formFor())

    expect(payload).toMatchObject({
      codTemplateArVariant: 'standard',
      codTemplateEnVariant: 'friendly',
    })
    for (const field of [
      'codTemplateUrVariant',
      'codTemplateEsVariant',
      'codTemplateFrVariant',
      'codReminderUrVariant',
    ]) {
      expect(payload).not.toHaveProperty(field)
    }
  })

  it('sends the style of a live language, and counts a change to it', () => {
    const response = liveUrduSettingsFixture()
    const saved = formFromSettings(response.state, response.template)
    const changed = {
      ...saved,
      defaultLanguage: 'ur' as const,
      codTemplateVariants: { ...saved.codTemplateVariants, ur: 'short_v1' },
    }

    expect(toSettingsPayload(saved).codTemplateUrVariant).toBe('standard_v1')
    expect(toSettingsPayload(changed)).toMatchObject({
      defaultLanguage: 'ur',
      codTemplateUrVariant: 'short_v1',
    })
    expect(dirtyTabs(changed, saved)).toEqual(new Set(['message']))
  })
})

describe('automatic cancellation settings', () => {
  it('is off by default and sends all three fields', () => {
    const form = formFor()
    expect(form).toMatchObject({
      autoCancelEnabled: false,
      autoCancelRestock: true,
      autoCancelNotifyCustomer: false,
    })
    expect(toSettingsPayload(form)).toMatchObject({
      autoCancelEnabled: false,
      autoCancelRestock: true,
      autoCancelNotifyCustomer: false,
    })
  })

  it('offers the 48-hour deadline and turns the escalation on when switched on', () => {
    const form = { ...formFor(), escalationEnabled: false }
    const next = { ...form, ...autoCancelTogglePatch(form, true) }
    expect(next.autoCancelEnabled).toBe(true)
    expect(next.escalationEnabled).toBe(true)
    expect(escalationMinutesFromForm(next)).toBe(AUTO_CANCEL_SUGGESTED_MINUTES)
  })

  it('keeps a later deadline the merchant already chose', () => {
    const form = formFor()
    const later = {
      ...form,
      escalationGapMinutes: 72 * 60 - form.followUpDelayMinutes,
    }
    expect(autoCancelTogglePatch(later, true)).not.toHaveProperty(
      'escalationGapMinutes'
    )
  })

  it('switches off with the no-reply alert it runs on', () => {
    expect(escalationTogglePatch(false)).toEqual({
      escalationEnabled: false,
      autoCancelEnabled: false,
    })
    const invalid = {
      ...formFor(),
      autoCancelEnabled: true,
      escalationEnabled: false,
    }
    expect(validateSettingsForm(invalid).autoCancel).toBe('requiresEscalation')
    expect(
      fieldErrorFromApiCode('SETTINGS_AUTO_CANCEL_REQUIRES_ESCALATION')
    ).toEqual({ autoCancel: 'requiresEscalation' })
  })

  it('counts a change as a Timing tab change', () => {
    const saved = formFor()
    expect([
      ...dirtyTabs({ ...saved, autoCancelNotifyCustomer: true }, saved),
    ]).toEqual(['timing'])
  })
})
