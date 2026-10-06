import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'
import ar from '../../../../public/messages/ar.json'
import en from '../../../../public/messages/en.json'
import { SEEDED_STYLES } from '../testing/settingsFixture'
import { templateStyleLabel } from './templateStyleLabel'

type Translator = Parameters<typeof templateStyleLabel>[0]

// `createTranslator` types its keys from the message file; the helper takes
// any style id, as the pages' `useTranslations` translator does.
const translators = {
  ar: createTranslator({
    locale: 'ar',
    messages: ar,
    namespace: 'settings.embedded.message',
  }) as unknown as Translator,
  en: createTranslator({
    locale: 'en',
    messages: en,
    namespace: 'settings.embedded.message',
  }) as unknown as Translator,
}

const STYLES = [...new Set([...SEEDED_STYLES.ar, ...SEEDED_STYLES.en])]

describe('templateStyleLabel', () => {
  it.each(STYLES)('labels the seeded style %s in both locales', (style) => {
    expect(templateStyleLabel(translators.ar, style)).toBe(
      ar.settings.embedded.message.variantLabels[style]
    )
    expect(templateStyleLabel(translators.en, style)).toBe(
      en.settings.embedded.message.variantLabels[style]
    )
  })

  it('names a staff-written version after its style, with its version', () => {
    expect(templateStyleLabel(translators.en, 'egyptian_v2')).toBe(
      `${en.settings.embedded.message.variantLabels.egyptian} 2`
    )
    expect(templateStyleLabel(translators.ar, 'egyptian_v2')).toBe(
      `${ar.settings.embedded.message.variantLabels.egyptian} 2`
    )
    // A new style has no name yet, with or without a version.
    expect(templateStyleLabel(translators.en, 'levantine_v1')).toBe(
      'levantine_v1'
    )
  })

  it('shows a style without a translation under its own id', () => {
    expect(templateStyleLabel(translators.ar, 'levantine')).toBe('levantine')
    expect(templateStyleLabel(translators.en, 'levantine')).toBe('levantine')
  })
})
