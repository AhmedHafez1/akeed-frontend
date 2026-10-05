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

  it('shows a style without a translation under its own id', () => {
    expect(templateStyleLabel(translators.ar, 'levantine')).toBe('levantine')
    expect(templateStyleLabel(translators.en, 'levantine')).toBe('levantine')
  })
})
