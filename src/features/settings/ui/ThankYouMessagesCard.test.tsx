import { useState, type ComponentType } from 'react'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(
    document.body
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe.each([
  [
    'standalone',
    Standalone,
    'switch',
    en.settings.thankYou.akeedCreditCost.replace('{count}', 'EGP 1'),
  ],
  ['embedded', Embedded, 'checkbox', en.settings.thankYou.planCost],
] as const)('%s thank-you settings', (_skin, Component, role, cost) => {
  it('shows sender-aware cost and expands the existing examples with one control', () => {
    renderCard(Component)
    const control = screen.getByRole(role, { name: en.settings.thankYou.label })
    expect(checked(control)).toBe(false)
    expect(screen.queryAllByText(en.settings.thankYou.off)).toHaveLength(0)
    expect(screen.getByText(cost)).toBeTruthy()
    const disclosure = screen
      .getByText(en.settings.thankYou.examplesHeading)
      .closest('details')!
    expect(disclosure.open).toBe(false)
    fireEvent.click(screen.getByText(en.settings.thankYou.examplesHeading))
    expect(disclosure.open).toBe(true)
    expect(screen.getByText('Confirmed 123 from Nour')).toBeTruthy()
    expect(screen.getByText('Canceled 123')).toBeTruthy()
    fireEvent.click(control)
    expect(checked(control)).toBe(true)
  })

  it('shows the own-number and Akeed prices as money', () => {
    renderCard(Component, {
      acknowledgment: {
        ...base.acknowledgment!,
        ownNumberCreditsPerMessage: 1,
      },
    })
    const text =
      _skin === 'embedded'
        ? en.settings.thankYou.planCost
        : en.settings.thankYou.senderCreditCost
            .replace('{own}', 'EGP 0.5')
            .replace('{akeed}', 'EGP 1')
    expect(screen.getByText(text)).toBeTruthy()
  })

  it('keeps English samples in LTR within Arabic UI and uses Arabic direction for missing text', async () => {
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
    fireEvent.click(screen.getByText(ar.settings.thankYou.examplesHeading))
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
  it('keeps automatic-style details available to read-only users', () => {
    renderCard(Component, { readOnly: true, automaticStyle: true })
    const details = screen
      .getByText(en.settings.thankYou.examplesHeading)
      .closest('details')!
    expect(details.open).toBe(false)
    fireEvent.click(screen.getByText(en.settings.thankYou.examplesHeading))
    expect(details.open).toBe(true)
    expect(screen.getByText(en.settings.thankYou.autoNote)).toBeTruthy()
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
