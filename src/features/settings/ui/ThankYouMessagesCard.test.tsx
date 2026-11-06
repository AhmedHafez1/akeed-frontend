import { useState, type ComponentType } from 'react'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppProvider } from '@shopify/polaris'
import polaris from '@shopify/polaris/locales/en.json'
import { NextIntlClientProvider } from 'next-intl'
import en from '../../../../public/messages/en.json'
import ar from '../../../../public/messages/ar.json'
import { ThankYouMessagesCard as Standalone } from '@/features/settings/skins/standalone/settings-page/ThankYouMessagesCard'
import { ThankYouMessagesCard as Embedded } from '@/features/settings/skins/embedded/settings-page/ThankYouMessagesCard'
import type { ThankYouMessagesProps } from '@/features/settings/domain/thankYouPreview'

const base: ThankYouMessagesProps = {
  acknowledgment: {
    available: true,
    creditsPerMessage: 2,
    previews: {
      en: {
        default: {
          confirmed: 'Confirmed {{order}} from {{store}}',
          canceled: 'Canceled {{order}}',
        },
      },
      ar: {},
      ur: {},
      es: {},
      fr: {},
      tr: {},
    },
  },
  checked: false,
  onChange: () => {},
  readOnly: false,
  language: 'en',
  style: null,
  sample: { store: 'Nour', order: '123' },
  automaticStyle: false,
}

function renderCard(
  Component: ComponentType<ThankYouMessagesProps>,
  patch: Partial<ThankYouMessagesProps> = {},
  locale: 'en' | 'ar' = 'en'
) {
  function Harness() {
    const [checked, setChecked] = useState(patch.checked ?? false)
    return (
      <Component {...base} {...patch} checked={checked} onChange={setChecked} />
    )
  }
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'en' ? en : ar}
      timeZone="UTC"
    >
      <AppProvider i18n={polaris}>
        <Harness />
      </AppProvider>
    </NextIntlClientProvider>
  )
}

afterEach(cleanup)

describe.each([
  [
    'standalone',
    Standalone,
    'switch',
    en.settings.thankYou.creditCost.replace('{count}', '2'),
  ],
  ['embedded', Embedded, 'checkbox', en.settings.thankYou.planCost],
] as const)('%s thank-you settings', (_skin, Component, role, cost) => {
  it('starts off, discloses the price, previews both outcomes, and toggles', () => {
    renderCard(Component)
    const control = screen.getByRole(role, { name: en.settings.thankYou.label })
    expect(checked(control)).toBe(false)
    expect(screen.getByText(en.settings.thankYou.off)).toBeTruthy()
    expect(screen.getByText(cost)).toBeTruthy()
    expect(
      screen.getByRole('heading', {
        name: en.settings.thankYou.examplesHeading,
      })
    ).toBeTruthy()
    expect(
      screen.getByText(en.settings.embedded.message.languageNames.en)
    ).toBeTruthy()
    expect(screen.getByText('Confirmed 123 from Nour')).toBeTruthy()
    expect(screen.getByText('Canceled 123')).toBeTruthy()
    fireEvent.click(control)
    expect(checked(control)).toBe(true)
    expect(screen.getByText(en.settings.thankYou.on)).toBeTruthy()
  })
  it('keeps English samples in LTR within Arabic UI and uses Arabic direction for missing text', () => {
    renderCard(
      Component,
      {
        acknowledgment: {
          ...base.acknowledgment!,
          previews: {
            ...base.acknowledgment!.previews,
            en: {
              default: {
                confirmed: 'Confirmed {{order}} from {{store}}',
                canceled: null,
              },
            },
          },
        },
      },
      'ar'
    )
    const sample = screen.getByText('Confirmed 123 from Nour')
    expect(sample.getAttribute('dir')).toBe('ltr')
    expect(sample.getAttribute('lang')).toBe('en')
    const missing = screen.getByText(ar.settings.thankYou.textUnavailable)
    expect(missing.getAttribute('dir')).toBe('rtl')
    expect(missing.getAttribute('lang')).toBe('ar')
    expect(screen.queryByText(/Reminders may use|التذكير ممكن/)).toBeNull()
  })
  it('prevents enabling while globally unavailable and permits an existing opt-in to be disabled', () => {
    const acknowledgment = { ...base.acknowledgment!, available: false }
    const view = renderCard(Component, { acknowledgment })
    expect(disabled(screen.getByRole(role))).toBe(true)
    expect(screen.getByText(en.settings.thankYou.unavailable)).toBeTruthy()
    view.unmount()
    renderCard(Component, { acknowledgment, checked: true })
    const control = screen.getByRole(role)
    expect(disabled(control)).toBe(false)
    fireEvent.click(control)
    expect(checked(control)).toBe(false)
    expect(disabled(control)).toBe(true)
  })
  it('keeps viewers read-only and renders translated labels', () => {
    renderCard(Component, { readOnly: true }, 'ar')
    expect(
      disabled(screen.getByRole(role, { name: ar.settings.thankYou.label }))
    ).toBe(true)
  })
  it('omits the feature when talking to an older backend', () => {
    renderCard(Component, { acknowledgment: undefined })
    expect(screen.queryByRole(role)).not.toBeTruthy()
  })
})

function checked(control: HTMLElement) {
  return control.getAttribute('role') === 'switch'
    ? control.getAttribute('aria-checked') === 'true'
    : (control as HTMLInputElement).checked
}
function disabled(control: HTMLElement) {
  return (control as HTMLInputElement).disabled
}
