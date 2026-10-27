import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import {
  allStylesSettingsFixture,
  awaitingTurkishSettingsFixture,
  awaitingUrduSettingsFixture,
  liveTurkishSettingsFixture,
  liveUrduSettingsFixture,
  settingsResponseFixture,
} from '../../../testing/settingsFixture'
import { templateMessageFixture } from '@/shared/lib/templateMessageFixture'
import { SettingsEmbeddedPage } from './SettingsEmbeddedPage'

const nav = vi.hoisted(() => ({
  search: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
}))

const api = vi.hoisted(() => ({
  fetchSettings: vi.fn(),
  saveSettings: vi.fn(),
}))

const onboarding = vi.hoisted(() => ({ sendOnboardingTest: vi.fn() }))

const shopify = vi.hoisted(() => ({
  saveBar: {
    show: vi.fn(() => Promise.resolve()),
    hide: vi.fn(() => Promise.resolve()),
    toggle: vi.fn(() => Promise.resolve()),
    leaveConfirmation: vi.fn(() => Promise.resolve()),
  },
  toast: { show: vi.fn() },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/ar/settings',
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  useSearchParams: () => nav.search,
}))

vi.mock('@/shared/hooks/useAkeedMode', () => ({
  useAkeedMode: () => ({
    mode: 'EMBEDDED',
    isEmbedded: true,
    isStandalone: false,
    isLoading: false,
    hostParam: 'host-1',
    shopDomain: 'test.myshopify.com',
    shopify,
  }),
}))

vi.mock('@/shared/hooks/useAppBridgeLoading', () => ({
  useAppBridgeLoading: () => undefined,
}))

vi.mock('../../../api/settingsApi', () => api)

vi.mock('@/features/onboarding/api/onboardingApi', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/onboarding/api/onboardingApi')
  >()),
  sendOnboardingTest: onboarding.sendOnboardingTest,
}))

const SAVE_BAR_ID = 'akeed-settings-save-bar'
const messageCopy = ar.settings.embedded.message

function renderPage(tab: string | null = 'message') {
  nav.search = new URLSearchParams(tab ? { tab } : {})
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  document.documentElement.dir = 'rtl'
  document.documentElement.lang = 'ar'
  // As a wrapper, the providers survive `rerender` when the tab changes.
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
      <AppProvider i18n={enTranslations}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </AppProvider>
    </NextIntlClientProvider>
  )
  const view = render(<SettingsEmbeddedPage />, { wrapper })
  const goTo = (nextTab: string) => {
    nav.search = new URLSearchParams({ tab: nextTab })
    view.rerender(<SettingsEmbeddedPage />)
  }
  return { ...view, goTo }
}

async function storeNameInput() {
  return (await screen.findByRole('textbox', {
    name: /اسم المتجر/,
  })) as HTMLInputElement
}

function lastSaveBarCall() {
  const shows = shopify.saveBar.show.mock.invocationCallOrder.at(-1) ?? 0
  const hides = shopify.saveBar.hide.mock.invocationCallOrder.at(-1) ?? 0
  return shows > hides ? 'shown' : 'hidden'
}

afterEach(() => vi.restoreAllMocks())

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(
    document.body
  )
  vi.clearAllMocks()
  api.fetchSettings.mockResolvedValue(settingsResponseFixture())
  api.saveSettings.mockImplementation(async (payload) =>
    settingsResponseFixture({ state: { storeName: payload.storeName } })
  )
  window.shopify = shopify as unknown as typeof window.shopify
})

describe('SettingsEmbeddedPage', () => {
  it('shows the save bar only while there are unsaved changes', async () => {
    renderPage()
    const input = await storeNameInput()
    expect(shopify.saveBar.show).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'Togo Store' } })

    await waitFor(() =>
      expect(shopify.saveBar.show).toHaveBeenCalledWith(SAVE_BAR_ID)
    )
    expect(lastSaveBarCall()).toBe('shown')
  })

  it('keeps edits across tabs, marks the tab, and hides the bar on Plan', async () => {
    const { goTo } = renderPage()
    fireEvent.change(await storeNameInput(), {
      target: { value: 'Togo Store' },
    })

    goTo('timing')
    await screen.findByText('ماذا يحدث مع كل طلب دفع عند الاستلام')
    // Polaris also renders a hidden measuring copy of the selected tab.
    expect(screen.getAllByRole('tab', { name: 'الرسالة •' }).length).toBe(1)
    expect(
      screen.getAllByRole('tab', { name: 'التوقيت والمتابعة' }).length
    ).toBeGreaterThan(0)
    expect(lastSaveBarCall()).toBe('shown')

    goTo('plan')
    await waitFor(() => expect(lastSaveBarCall()).toBe('hidden'))
    expect(
      screen.getByText(/لديك تغييرات غير محفوظة في تبويب آخر/)
    ).toBeTruthy()

    goTo('message')
    expect((await storeNameInput()).value).toBe('Togo Store')
    await waitFor(() => expect(lastSaveBarCall()).toBe('shown'))
  })

  it('discard restores the saved values and hides the bar', async () => {
    renderPage()
    const input = await storeNameInput()
    fireEvent.change(input, { target: { value: 'Something else' } })
    await waitFor(() => expect(lastSaveBarCall()).toBe('shown'))

    fireEvent.click(screen.getByText('تجاهل'))

    expect((await storeNameInput()).value).toBe('Togo_Test_A')
    await waitFor(() => expect(lastSaveBarCall()).toBe('hidden'))
  })

  it('saves once, shows a toast, and returns to a clean state', async () => {
    renderPage()
    fireEvent.change(await storeNameInput(), {
      target: { value: 'Togo Store' },
    })

    await act(async () => {
      fireEvent.click(screen.getByText('حفظ'))
    })

    expect(api.saveSettings).toHaveBeenCalledTimes(1)
    expect(api.saveSettings.mock.calls[0][0]).toMatchObject({
      storeName: 'Togo Store',
      escalationDelayMinutes: 1080,
      timezone: 'Africa/Cairo',
    })
    expect(shopify.toast.show).toHaveBeenCalledWith('تم حفظ الإعدادات')
    await waitFor(() => expect(lastSaveBarCall()).toBe('hidden'))
  })

  it('blocks an invalid save, shows the error, and focuses the field', async () => {
    renderPage()
    const input = await storeNameInput()
    fireEvent.change(input, { target: { value: '   ' } })

    await act(async () => {
      fireEvent.click(screen.getByText('حفظ'))
    })

    expect(api.saveSettings).not.toHaveBeenCalled()
    expect(screen.getByText('أدخل اسم المتجر.')).toBeTruthy()
    expect(
      screen.getByText('بعض الحقول تحتاج إلى مراجعة قبل الحفظ.')
    ).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(input))
  })

  it('moves to the tab holding an invalid field before focusing it', async () => {
    const { goTo } = renderPage('message')
    fireEvent.change(await storeNameInput(), { target: { value: '' } })
    goTo('timing')
    await screen.findByText('ماذا يحدث مع كل طلب دفع عند الاستلام')

    await act(async () => {
      fireEvent.click(screen.getByText('حفظ'))
    })

    expect(nav.push).toHaveBeenCalledWith('/ar/settings?tab=message')
    goTo('message')
    const input = await storeNameInput()
    await waitFor(() => expect(document.activeElement).toBe(input))
  })

  it.each([
    ['store', 'message'],
    ['confirmation', 'timing'],
    ['message-preview', 'message'],
    ['billing', 'plan'],
  ])('redirects the old ?tab=%s to ?tab=%s', async (oldTab, newTab) => {
    renderPage(oldTab)
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith(`/ar/settings?tab=${newTab}`)
    )
  })

  it('renders the Plan tab: warning banner, LTR prices, one recommendation', async () => {
    renderPage('plan')

    expect(await screen.findByText('متبقي 3 رسائل مجانية')).toBeTruthy()
    expect(screen.getByText('US$ 9.99')).toBeTruthy()
    expect(screen.getByText('US$ 49.99')).toBeTruthy()
    expect(screen.getAllByText('الأنسب لاستخدامك')).toHaveLength(1)
    expect(screen.getByText('أرسلت 28 رسالة في آخر 30 يوماً.')).toBeTruthy()
    expect(shopify.saveBar.show).not.toHaveBeenCalled()
  })

  it('sends a test straight to a saved number', async () => {
    onboarding.sendOnboardingTest.mockResolvedValue({})
    renderPage()
    await storeNameInput()

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: messageCopy.testSend })
      )
    })

    expect(onboarding.sendOnboardingTest).toHaveBeenCalledWith({
      resend: true,
      language: 'ar',
    })
    expect(shopify.toast.show).toHaveBeenCalledWith(
      ar.settings.embedded.testSendSuccess
    )
    expect(screen.queryByLabelText(messageCopy.testPhone.label)).toBeNull()
    expect(api.saveSettings).not.toHaveBeenCalled()
  })

  it('asks for the number in the card when none is saved, from the store phone', async () => {
    onboarding.sendOnboardingTest.mockResolvedValue({})
    api.fetchSettings.mockResolvedValue(
      settingsResponseFixture({
        state: { merchantWhatsappPhone: null, shopPhone: '+201001234567' },
      })
    )
    api.saveSettings.mockImplementation(async (payload) =>
      settingsResponseFixture({
        state: { merchantWhatsappPhone: payload.merchantWhatsappPhone },
      })
    )
    renderPage()
    await storeNameInput()

    fireEvent.click(screen.getByRole('button', { name: messageCopy.testSend }))

    const field = (await screen.findByLabelText(
      messageCopy.testPhone.label
    )) as HTMLInputElement
    expect(onboarding.sendOnboardingTest).not.toHaveBeenCalled()
    expect(field.value.replace(/\s/g, '')).toBe('+201001234567')
    expect(screen.getByText(messageCopy.testPhone.suggested)).toBeTruthy()

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: messageCopy.testPhone.submit })
      )
    })

    expect(api.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'Togo_Test_A',
        merchantWhatsappPhone: '+201001234567',
      })
    )
    expect(onboarding.sendOnboardingTest).toHaveBeenCalledWith({
      resend: true,
      language: 'ar',
    })
    expect(shopify.toast.show).toHaveBeenCalledWith(
      ar.settings.embedded.testSendSuccess
    )
    await waitFor(() =>
      expect(screen.queryByLabelText(messageCopy.testPhone.label)).toBeNull()
    )
    expect(
      screen.getByRole('button', { name: messageCopy.testPhone.change })
    ).toBeTruthy()
  })

  it('refuses an invalid number in place', async () => {
    api.fetchSettings.mockResolvedValue(
      settingsResponseFixture({ state: { merchantWhatsappPhone: null } })
    )
    renderPage()
    await storeNameInput()
    fireEvent.click(screen.getByRole('button', { name: messageCopy.testSend }))
    await screen.findByLabelText(messageCopy.testPhone.label)

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: messageCopy.testPhone.submit })
      )
    })

    expect(screen.getByText(messageCopy.testPhone.invalid)).toBeTruthy()
    expect(api.saveSettings).not.toHaveBeenCalled()
    expect(onboarding.sendOnboardingTest).not.toHaveBeenCalled()
  })

  it('does not redirect a current tab id', async () => {
    renderPage('timing')
    await screen.findByText('ماذا يحدث مع كل طلب دفع عند الاستلام')
    expect(nav.replace).not.toHaveBeenCalled()
  })

  describe('message styles come from the settings response', () => {
    beforeEach(() => {
      api.fetchSettings.mockResolvedValue(allStylesSettingsFixture())
    })

    it('lists every Arabic style the API returns under its label', async () => {
      renderPage()
      await storeNameInput()
      const labels = messageCopy.variantLabels

      for (const name of [
        labels.standard,
        labels.egyptian,
        labels.gulf,
        labels.short,
      ]) {
        expect(screen.getByRole('radio', { name })).toBeTruthy()
      }
      // A style with no translation yet shows under its own id.
      expect(screen.getByRole('radio', { name: 'levantine' })).toBeTruthy()
    })

    it('saves a style this app has no list entry for', async () => {
      renderPage()
      await storeNameInput()

      fireEvent.click(screen.getByRole('radio', { name: 'levantine' }))
      await act(async () => {
        fireEvent.click(screen.getByText('حفظ'))
      })

      expect(api.saveSettings).toHaveBeenCalledTimes(1)
      expect(api.saveSettings.mock.calls[0][0]).toMatchObject({
        codTemplateArVariant: 'levantine',
        codTemplateEnVariant: 'friendly',
      })
    })
  })
})

describe('SettingsEmbeddedPage message improvements', () => {
  function offered() {
    const response = settingsResponseFixture()
    return {
      ...response,
      template: {
        ...response.template,
        reminder: {
          selected: { ar: 'gulf_v1', en: null },
          variants: {
            ar: [
              {
                language: 'ar' as const,
                variant: 'gulf_v1',
                metaTemplateName: 'akeed_cod_reminder_gulf_v1',
                metaLanguageCode: 'ar',
                bodyParameterOrder: ['order'] as Array<
                  'customer' | 'store' | 'order' | 'total'
                >,
                message: templateMessageFixture(
                  ['تذكير بطلب #{{order}}'],
                  ['تأكيد', 'إلغاء'],
                  { direction: 'rtl' }
                ),
              },
            ],
            en: [],
          },
        },
        arabicAuto: { selected: true },
      },
    }
  }

  it('offers neither choice unless the response does', async () => {
    renderPage()
    await storeNameInput()
    expect(
      screen.queryByRole('radio', { name: messageCopy.variantLabels.auto })
    ).toBeNull()
    expect(
      screen.queryByRole('radio', { name: messageCopy.reminderSame })
    ).toBeNull()
  })

  it('reads the saved choices, and saves a change back', async () => {
    api.fetchSettings.mockResolvedValue(offered())
    renderPage()
    await storeNameInput()

    const auto = screen.getByRole('radio', {
      name: messageCopy.variantLabels.auto,
    }) as HTMLInputElement
    expect(auto.checked).toBe(true)
    expect(screen.getByText(messageCopy.autoStylePreviewNote)).toBeTruthy()
    // The only version of its style on screen: named without its number.
    const reminder = screen.getByRole('radio', {
      name: 'خليجي',
    }) as HTMLInputElement
    expect(reminder.checked).toBe(true)

    fireEvent.click(
      screen.getByRole('radio', { name: messageCopy.reminderSame })
    )
    fireEvent.click(
      screen.getByRole('radio', { name: messageCopy.variantLabels.egyptian })
    )
    await act(async () => {
      fireEvent.click(screen.getByText('حفظ'))
    })

    expect(api.saveSettings.mock.calls[0][0]).toMatchObject({
      codTemplateArVariant: 'egyptian',
      codTemplateArAuto: false,
      codReminderArVariant: null,
      codReminderEnVariant: null,
    })
  })

  it('renders the message lines and their own replies, or says it is empty', async () => {
    const response = settingsResponseFixture()
    response.template.variants.ar[0].message = templateMessageFixture(
      ['هلا {{customer}}، طلبك #{{order}}'],
      ['نعم', 'لا'],
      { direction: 'rtl', source: 'provider' }
    )
    api.fetchSettings.mockResolvedValue(response)
    const view = renderPage()
    await storeNameInput()
    const bubble = screen.getByRole('img', {
      name: new RegExp(
        ar.settings.embedded.message.previewAria.replace('{language}', '.*')
      ),
    })
    expect(bubble.textContent).toContain('هلا أحمد، طلبك')
    expect(within(bubble).getByText('نعم')).toBeTruthy()
    view.unmount()

    response.template.variants.ar[0].message = templateMessageFixture(
      [],
      ['نعم', 'لا'],
      { direction: 'rtl' }
    )
    api.fetchSettings.mockResolvedValue(response)
    renderPage()
    await storeNameInput()
    expect(
      within(
        screen.getByRole('img', {
          name: new RegExp(
            ar.settings.embedded.message.previewAria.replace('{language}', '.*')
          ),
        })
      ).getByText(messageCopy.previewEmpty)
    ).toBeTruthy()
  })

  it('shows bold as WhatsApp does, and the total as it is sent', async () => {
    const response = settingsResponseFixture()
    response.template.variants.ar[0].message = templateMessageFixture(
      ['طلبك من *{{store}}* بإجمالي *{{total}}* يا {{customer}}'],
      ['نعم', 'لا'],
      { direction: 'rtl', source: 'provider' }
    )
    api.fetchSettings.mockResolvedValue(response)
    renderPage()
    await storeNameInput()

    const picture = screen.getByRole('img', {
      name: new RegExp(
        ar.settings.embedded.message.previewAria.replace('{language}', '.*')
      ),
    })
    expect(picture.textContent).not.toContain('*')
    expect(within(picture).getByText('Togo_Test_A').tagName).toBe('B')
    expect(within(picture).getByText('599.00 $').tagName).toBe('B')
    // A value the message does not mark is not bold.
    expect(within(picture).queryByText('أحمد', { selector: 'b' })).toBeNull()
    expect(
      screen.getByText(
        messageCopy.previewingLabel
          .replace('{language}', messageCopy.languageNames.ar)
          .replace('{style}', messageCopy.variantLabels.standard)
      )
    ).toBeTruthy()
  })
})

describe('SettingsEmbeddedPage message languages', () => {
  const previewLanguage = () =>
    screen.getByLabelText(messageCopy.previewLanguageGroup) as HTMLSelectElement
  const previewIn = (language: string) =>
    fireEvent.change(previewLanguage(), { target: { value: language } })
  const radio = (name: string) =>
    screen.getByRole('radio', { name: new RegExp(name) }) as HTMLInputElement
  const chooseOneLanguage = () =>
    fireEvent.click(radio(messageCopy.languageFixed))
  const oneLanguage = () =>
    screen.getByLabelText(messageCopy.languageFixedLabel) as HTMLSelectElement
  const languageOption = (language: string) =>
    Array.from(oneLanguage().options).find(
      (option) => option.value === language
    ) as HTMLOptionElement
  // Staff-written styles: a version of "standard" and one of "short", each
  // the only version of its style, so neither shows its number.
  const standardStyle = messageCopy.variantLabels.standardPlain
  const shortStyle = messageCopy.variantLabels.short

  it('shows a language with no approved message, but does not let it be chosen', async () => {
    renderPage()
    await storeNameInput()

    expect(
      Array.from(previewLanguage().options).map((option) => option.value)
    ).toEqual(['ar', 'en', 'ur', 'es', 'fr', 'tr'])
    // Automatic shows no list; one language for everyone does.
    expect(screen.queryByLabelText(messageCopy.languageFixedLabel)).toBeNull()
    chooseOneLanguage()

    expect(oneLanguage().value).toBe('ar')
    for (const language of ['ur', 'es', 'fr', 'tr']) {
      expect(languageOption(language).disabled).toBe(true)
      expect(languageOption(language).textContent).toContain(
        messageCopy.notEnabledYet
      )
    }
    expect(languageOption('ar').disabled).toBe(false)
    expect(languageOption('en').disabled).toBe(false)
  })

  it('sends the test in the language being previewed', async () => {
    onboarding.sendOnboardingTest.mockResolvedValue({})
    renderPage()
    await storeNameInput()
    previewIn('en')

    // The helper names the language of the message on the phone.
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          element.textContent.includes('+20') &&
          element.textContent.includes(messageCopy.languageNames.en)
      )
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: messageCopy.testSend }))

    await waitFor(() =>
      expect(onboarding.sendOnboardingTest).toHaveBeenCalledWith({
        resend: true,
        language: 'en',
      })
    )
  })

  it('has nothing to test while the previewed language has no approved message', async () => {
    renderPage()
    await storeNameInput()
    previewIn('fr')

    const send = screen.getByRole('button', {
      name: messageCopy.testSend,
    }) as HTMLButtonElement
    expect(send.getAttribute('aria-disabled')).toBe('true')
    expect(
      screen.getByText(
        messageCopy.testSendLanguageLocked.replace(
          '{language}',
          messageCopy.languageNames.fr
        )
      )
    ).toBeTruthy()
    fireEvent.click(send)
    expect(onboarding.sendOnboardingTest).not.toHaveBeenCalled()

    // Back on a language the store can use, the test is offered again.
    previewIn('ar')
    expect(send.getAttribute('aria-disabled')).toBe('false')
  })

  it('previews the one language a store sends, with no second language list', async () => {
    onboarding.sendOnboardingTest.mockResolvedValue({})
    api.saveSettings.mockImplementation(async (payload) =>
      settingsResponseFixture({
        state: { defaultLanguage: payload.defaultLanguage },
      })
    )
    const styleHint = (language: 'ar' | 'en') =>
      messageCopy.styleForLanguage.replace(
        '{language}',
        messageCopy.languageNames[language]
      )
    renderPage()
    await storeNameInput()

    // Automatic: the preview picks a language, and the style card names it.
    expect(
      screen.queryByLabelText(messageCopy.previewLanguageGroup)
    ).toBeTruthy()
    fireEvent.mouseEnter(
      screen.getByRole('img', {
        name: messageCopy.styleHeading,
      })
    )
    expect((await screen.findByRole('tooltip')).textContent).toBe(
      styleHint('ar')
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())

    chooseOneLanguage()
    fireEvent.change(oneLanguage(), { target: { value: 'en' } })

    expect(screen.queryByLabelText(messageCopy.previewLanguageGroup)).toBeNull()
    expect(screen.queryByText(styleHint('en'))).toBeNull()
    expect(
      screen
        .getByRole('img', {
          name: new RegExp(
            ar.settings.embedded.message.previewAria.replace('{language}', '.*')
          ),
        })
        .getAttribute('aria-label')
    ).toContain(messageCopy.languageNames.en)

    // Unsaved: the test would send the saved settings, so it waits.
    const send = () =>
      screen.getByRole('button', {
        name: messageCopy.testSend,
      }) as HTMLButtonElement
    expect(send().getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByText(messageCopy.testSendSaveFirst)).toBeTruthy()
    fireEvent.click(send())
    expect(onboarding.sendOnboardingTest).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.click(screen.getByText('حفظ'))
    })
    await waitFor(() =>
      expect(send().getAttribute('aria-disabled')).toBe('false')
    )
    fireEvent.click(send())

    await waitFor(() =>
      expect(onboarding.sendOnboardingTest).toHaveBeenCalledWith({
        resend: true,
        language: 'en',
      })
    )
  })

  it('returns the preview to the saved language when a change is discarded', async () => {
    api.fetchSettings.mockResolvedValue(
      settingsResponseFixture({
        state: { defaultLanguage: 'ar' },
      })
    )
    renderPage()
    await storeNameInput()
    expect(screen.queryByLabelText(messageCopy.previewLanguageGroup)).toBeNull()
    expect(
      screen
        .getByRole('img', {
          name: new RegExp(
            ar.settings.embedded.message.previewAria.replace('{language}', '.*')
          ),
        })
        .getAttribute('aria-label')
    ).toContain(messageCopy.languageNames.ar)

    fireEvent.change(oneLanguage(), { target: { value: 'en' } })
    expect(
      screen
        .getByRole('img', {
          name: new RegExp(
            ar.settings.embedded.message.previewAria.replace('{language}', '.*')
          ),
        })
        .getAttribute('aria-label')
    ).toContain(messageCopy.languageNames.en)

    fireEvent.click(screen.getByText('تجاهل'))

    await waitFor(() =>
      expect(
        screen
          .getByRole('img', {
            name: new RegExp(
              ar.settings.embedded.message.previewAria.replace(
                '{language}',
                '.*'
              )
            ),
          })
          .getAttribute('aria-label')
      ).toContain(messageCopy.languageNames.ar)
    )
  })

  it('says so when a language has no messages at all', async () => {
    renderPage()
    await storeNameInput()
    previewIn('fr')

    expect(
      screen.getByText(
        messageCopy.stylesEmpty.replace(
          '{language}',
          messageCopy.languageNames.fr
        )
      )
    ).toBeTruthy()
  })

  it('lists messages that are not approved yet as locked', async () => {
    api.fetchSettings.mockResolvedValue(awaitingUrduSettingsFixture())
    renderPage()
    await storeNameInput()
    previewIn('ur')

    expect(radio(standardStyle).disabled).toBe(true)
    expect(radio(shortStyle).disabled).toBe(true)
    expect(radio(standardStyle).checked).toBe(false)
    expect(screen.getByText(messageCopy.awaitingApproval)).toBeTruthy()
    expect(
      screen.getByText(
        messageCopy.languageLockedNote.replaceAll(
          '{language}',
          messageCopy.languageNames.ur
        )
      )
    ).toBeTruthy()
    expect(lastSaveBarCall()).toBe('hidden')
  })

  it('lets a store choose a live language and one of its styles, and saves both', async () => {
    api.fetchSettings.mockResolvedValue(liveUrduSettingsFixture())
    renderPage()
    await storeNameInput()

    chooseOneLanguage()
    fireEvent.change(oneLanguage(), { target: { value: 'ur' } })
    // One language: the preview follows it, with no list of its own.
    expect(screen.queryByLabelText(messageCopy.previewLanguageGroup)).toBeNull()
    expect(
      screen
        .getByRole('img', {
          name: new RegExp(
            ar.settings.embedded.message.previewAria.replace('{language}', '.*')
          ),
        })
        .getAttribute('aria-label')
    ).toContain(messageCopy.languageNames.ur)
    fireEvent.click(radio(shortStyle))
    await act(async () => {
      fireEvent.click(screen.getByText('حفظ'))
    })

    expect(api.saveSettings).toHaveBeenCalledTimes(1)
    const [payload] = api.saveSettings.mock.calls[0] as [
      Record<string, unknown>,
    ]
    expect(payload).toMatchObject({
      defaultLanguage: 'ur',
      codTemplateUrVariant: 'short_v1',
      codTemplateArVariant: 'standard',
    })
    expect(payload).not.toHaveProperty('codTemplateEsVariant')
  })

  it('keeps Turkish locked while its messages are not approved and switched on', async () => {
    api.fetchSettings.mockResolvedValue(awaitingTurkishSettingsFixture())
    renderPage()
    await storeNameInput()
    previewIn('tr')

    expect(radio(standardStyle).disabled).toBe(true)
    expect(radio(shortStyle).disabled).toBe(true)
    expect(screen.getByText(messageCopy.awaitingApproval)).toBeTruthy()
    expect(lastSaveBarCall()).toBe('hidden')
  })

  it('offers both approved Turkish confirmations once Turkish is live', async () => {
    api.fetchSettings.mockResolvedValue(liveTurkishSettingsFixture())
    renderPage()
    await storeNameInput()

    chooseOneLanguage()
    fireEvent.change(oneLanguage(), { target: { value: 'tr' } })
    expect(radio(standardStyle).disabled).toBe(false)
    expect(radio(shortStyle).disabled).toBe(false)
    fireEvent.click(radio(shortStyle))
    await act(async () => {
      fireEvent.click(screen.getByText('حفظ'))
    })

    const [payload] = api.saveSettings.mock.calls[0] as [
      Record<string, unknown>,
    ]
    expect(payload).toMatchObject({
      defaultLanguage: 'tr',
      codTemplateTrVariant: 'short_v1',
    })
  })
})

describe('message settings contextual help', () => {
  const messageCopy = ar.settings.embedded.message

  it('reveals help without selecting a language or saving', async () => {
    renderPage()
    await storeNameInput()
    const auto = screen.getByRole('radio', {
      name: new RegExp(messageCopy.languageAuto),
    })
    const initialChecked =
      auto.getAttribute('aria-checked') ?? (auto as HTMLInputElement).checked
    expect(screen.queryByRole('tooltip')).toBeNull()
    const help = screen.getByRole('img', {
      name: messageCopy.languageFixed,
    })
    expect(help.closest('label')).toBeNull()
    expect(help.parentElement?.closest('[role="radio"]')).toBeNull()

    fireEvent.mouseEnter(help)
    expect((await screen.findByRole('tooltip')).textContent).toBe(
      messageCopy.languageFixedHelp
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())

    fireEvent.click(help)
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(help.closest('button')).toBeNull()
    fireEvent.focus(help)
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    fireEvent.blur(help)
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
    fireEvent.mouseEnter(help)
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    fireEvent.mouseLeave(help)
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())

    expect(
      auto.getAttribute('aria-checked') ?? (auto as HTMLInputElement).checked
    ).toBe(initialChecked)
    expect(screen.queryByLabelText(messageCopy.languageFixedLabel)).toBeNull()
    expect(api.saveSettings).not.toHaveBeenCalled()
    expect(shopify.saveBar.show).not.toHaveBeenCalled()
  })

  it('keeps the store-name example current', async () => {
    renderPage()
    const input = await storeNameInput()
    fireEvent.change(input, { target: { value: 'Sample Store' } })
    fireEvent.mouseEnter(
      screen.getByRole('img', {
        name: messageCopy.storeNameLabel,
      })
    )
    expect((await screen.findByRole('tooltip')).textContent).toContain(
      'Sample Store'
    )
  })
})

it.each([
  [ar.settings.logo.heading, ar.settings.logo.description],
  [
    ar.settings.embedded.message.reminderHeading,
    ar.settings.embedded.message.reminderHint,
  ],
])(
  'shows %s details only through its help control',
  async (label, description) => {
    const response = settingsResponseFixture({})
    response.branding = {
      logoUrl: null,
      bannerUrl: null,
      updatedAt: null,
      logoHeaderAvailable: true,
    }
    response.template.reminder = {
      selected: response.template.selected,
      variants: response.template.variants,
    }
    api.fetchSettings.mockResolvedValue(response)

    renderPage()
    await storeNameInput()
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(screen.queryByText(description)).toBeNull()
    fireEvent.mouseEnter(screen.getByRole('img', { name: label }))
    expect((await screen.findByRole('tooltip')).textContent).toContain(
      description
    )
  }
)

it('keeps contextual help available for read-only stores', async () => {
  api.fetchSettings.mockResolvedValue(
    settingsResponseFixture({
      state: {
        permissions: {
          canUpdateConfiguration: false,
          canCompleteOnboarding: false,
        },
      },
    })
  )
  renderPage()
  expect((await storeNameInput()).disabled).toBe(true)
  const help = screen.getByRole('img', {
    name: ar.settings.embedded.message.languageAuto,
  })
  expect(help.getAttribute('tabindex')).toBe('0')
  fireEvent.mouseEnter(help)
  expect((await screen.findByRole('tooltip')).textContent).toBe(
    ar.settings.embedded.message.languageAutoHelp
  )
  expect(api.saveSettings).not.toHaveBeenCalled()
})
