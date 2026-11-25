import { describe, expect, it } from 'vitest'
import { settingsResponseFixture } from '../testing/settingsFixture'
import {
  dirtyTabs,
  fieldErrorFromApiCode,
  formFromSettings,
  toSettingsPayload,
} from './settingsForm'
import { addShippingTag, isAkeedTag } from './shippingTags'
import { resolveSettingsTab } from './settingsTabs'

function formFor(
  state: NonNullable<
    Parameters<typeof settingsResponseFixture>[0]
  >['state'] = {}
) {
  const response = settingsResponseFixture({ state })
  return formFromSettings(response.state, response.template)
}

const ON = {
  shippingNotificationsEnabled: true,
  shippingFulfillmentTriggerEnabled: true,
  shippingTags: ['Shipped'],
}

describe('shipping settings in the form', () => {
  it('never sends the shipping fields when the backend did not send them', () => {
    const payload = toSettingsPayload(formFor())
    expect(payload).not.toHaveProperty('shippingNotificationsEnabled')
    expect(payload).not.toHaveProperty('shippingFulfillmentTriggerEnabled')
    expect(payload).not.toHaveProperty('shippingTags')
  })

  it('maps the three fields both ways', () => {
    expect(toSettingsPayload(formFor(ON))).toMatchObject(ON)
  })

  it('marks only the Shipping tab dirty, comparing tags by value', () => {
    const saved = formFor(ON)
    expect(dirtyTabs({ ...saved, shippingTags: ['Shipped'] }, saved).size).toBe(
      0
    )
    expect([
      ...dirtyTabs({ ...saved, shippingTags: ['Shipped', 'Bosta'] }, saved),
    ]).toEqual(['shipping'])
    expect([
      ...dirtyTabs(
        { ...saved, shippingFulfillmentTriggerEnabled: false },
        saved
      ),
    ]).toEqual(['shipping'])
  })

  it('puts a server tag refusal on the tag field', () => {
    expect(fieldErrorFromApiCode('SETTINGS_SHIPPING_TAGS_INVALID')).toEqual({
      shippingTags: 'invalidTags',
    })
  })

  it('opens ?tab=shipping', () => {
    expect(resolveSettingsTab('shipping')).toBe('shipping')
  })
})

describe('addShippingTag', () => {
  it('trims and adds a tag', () => {
    expect(addShippingTag(['Shipped'], '  Bosta ')).toEqual({
      tags: ['Shipped', 'Bosta'],
    })
  })

  it('ignores an empty field', () => {
    expect(addShippingTag([], '   ')).toBeNull()
  })

  it.each([
    'Akeed: Verified',
    'akeed:x',
    ' AKEED: Confirmed',
    'Ａｋｅｅｄ: wide',
  ])('refuses an Akeed tag: %s', (tag) => {
    expect(isAkeedTag(tag)).toBe(true)
    expect(addShippingTag([], tag)).toEqual({ error: 'reserved' })
  })

  it('keeps one spelling, comparing case and width as the backend does', () => {
    expect(addShippingTag(['Shipped'], 'SHIPPED')).toEqual({
      error: 'duplicate',
    })
    expect(addShippingTag(['شحن سريع'], 'شحن سريع ')).toEqual({
      error: 'duplicate',
    })
  })

  it('counts length in characters, up to 40', () => {
    expect(addShippingTag([], 'ش'.repeat(40))).toEqual({
      tags: ['ش'.repeat(40)],
    })
    expect(addShippingTag([], 'x'.repeat(41))).toEqual({ error: 'tooLong' })
  })

  it('allows at most 10 tags', () => {
    const ten = Array.from({ length: 10 }, (_, i) => `T${i}`)
    expect(addShippingTag(ten, 'Eleven')).toEqual({ error: 'tooMany' })
  })
})
