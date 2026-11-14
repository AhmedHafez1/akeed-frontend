import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
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
import { SettingsStandalonePage } from './SettingsStandalonePage'

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

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/ar/settings',
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  useSearchParams: () => nav.search,
}))

vi.mock('@/shared/hooks/useAkeedMode', () => ({
  useAkeedMode: () => ({
    mode: 'STANDALONE',
    isEmbedded: false,
    isStandalone: true,
    isLoading: false,
    shopify: null,
  }),
}))

vi.mock('@/shared/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/ui')>()),
  notify: toast,
}))

vi.mock('../../../api/settingsApi', () => api)

vi.mock('@/features/onboarding/api/onboardingApi', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/onboarding/api/onboardingApi')
  >()),
  sendOnboardingTest: onboarding.sendOnboardingTest,
}))

const whatsapp = vi.hoisted(() => ({ sender: vi.fn(), connection: vi.fn() }))

vi.mock(
  '@/features/whatsapp-connect/api/whatsappConnectApi',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/features/whatsapp-connect/api/whatsappConnectApi')
    >()),
    getWhatsappSender: whatsapp.sender,
    getWhatsappConnection: whatsapp.connection,
  })
)

const copy = ar.settings.standalone
const promptCopy = ar.settings.embedded.message.testPhone
const standaloneSource = {
  platformType: 'standalone',
  identity: 'org-1',
} as const

function renderPage(query: Record<string, string> = {}) {
  nav.search = new URLSearchParams(query)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  document.documentElement.dir = 'rtl'
  document.documentElement.lang = 'ar'
  // As a wrapper, the providers survive `rerender` when the tab changes.
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  )
  const view = render(<SettingsStandalonePage />, { wrapper })
  const goTo = (tab: string) => {
    nav.search = new URLSearchParams({ tab })
    view.rerender(<SettingsStandalonePage />)
  }
  return { ...view, goTo }
}

function styleSelect() {
  return screen.getByRole('combobox', {
    name: ar.settings.embedded.message.styleHeading,
  }) as HTMLSelectElement
}
function styleOption(name: string | RegExp) {
  return within(styleSelect()).getByRole('option', {
    name: typeof name === 'string' ? new RegExp(name) : name,
  }) as HTMLOptionElement
}
function chooseStyle(option: HTMLOptionElement) {
  fireEvent.change(styleSelect(), { target: { value: option.value } })
}

async function storeNameInput() {
  return (await screen.findByRole('textbox', {
    name: /اسم المتجر/,
  })) as HTMLInputElement
}

const tab = (name: string | RegExp) => screen.getByRole('tab', { name })
const saveBar = () =>
  screen.queryByRole('region', { name: copy.page.saveBar.label })
const preview = () =>
  screen.getByRole('img', {
    name: new RegExp(
      ar.settings.embedded.message.previewAria.replace('{language}', '.*')
    ),
  })
const previewLanguage = () =>
  screen.getByRole('combobox', {
    name: ar.settings.embedded.message.previewLanguageGroup,
  }) as HTMLSelectElement
const previewIn = (language: string) =>
  fireEvent.change(previewLanguage(), { target: { value: language } })

beforeEach(() => {
  vi.clearAllMocks()
  whatsapp.sender.mockResolvedValue({
    available: false,
    appId: null,
    configId: null,
    canConnect: false,
  })
  whatsapp.connection.mockResolvedValue({ connection: null })
  api.fetchSettings.mockResolvedValue(
    settingsResponseFixture({ state: { source: standaloneSource } })
  )
  api.saveSettings.mockImplementation(async (payload) =>
    settingsResponseFixture({
      state: { source: standaloneSource, storeName: payload.storeName },
    })
  )
})

describe('SettingsStandalonePage tabs', () => {
  it('opens on the Message tab with the page header', async () => {
    renderPage()
    await storeNameInput()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'الإعدادات'
    )
    expect(screen.getByRole('tablist')).toBeTruthy()
    expect(tab('الرسالة').getAttribute('aria-selected')).toBe('true')
    expect(tab('التوقيت والمتابعة').getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(
      tab('الرسالة').id
    )
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('follows ?tab= and pushes the chosen tab without scrolling', async () => {
    renderPage({ tab: 'timing' })
    await screen.findAllByRole('switch')

    expect(tab('التوقيت والمتابعة').getAttribute('aria-selected')).toBe('true')
    fireEvent.click(tab('المتجر'))

    expect(nav.push).toHaveBeenCalledWith('/ar/settings?tab=store', {
      scroll: false,
    })
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('moves between tabs with the arrow keys', async () => {
    renderPage()
    await storeNameInput()

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' })

    // API keys is the last tab.
    expect(nav.push).toHaveBeenCalledWith('/ar/settings?tab=api-keys', {
      scroll: false,
    })
    expect(document.activeElement).toBe(tab('مفاتيح API'))
  })

  it('steps from the focused tab while the URL has not caught up', async () => {
    renderPage()
    await storeNameInput()
    const tablist = screen.getByRole('tablist')
    // jsdom does not inherit `direction`, so it is set on the list itself.
    tablist.style.direction = 'rtl'
    tab('الرسالة').focus()

    // In Arabic the left arrow moves forward. `?tab=` stays on Message.
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' })
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' })

    expect(nav.push.mock.calls.map(([href]) => href)).toEqual([
      '/ar/settings?tab=timing',
      '/ar/settings?tab=store',
    ])
    expect(document.activeElement).toBe(tab('المتجر'))
  })

  it.each([
    [{ section: 'automation' }, 'timing'],
    [{ section: 'general' }, 'message'],
    [{ tab: 'templates' }, 'message'],
    [{ tab: 'confirmation' }, 'timing'],
  ])('replaces the legacy link %o with the %s tab', async (query, target) => {
    renderPage(query)

    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith(`/ar/settings?tab=${target}`, {
        scroll: false,
      })
    )
    expect(nav.push).not.toHaveBeenCalled()
  })

  it.each([[{ tab: 'billing' }], [{ tab: 'plan' }], [{ section: 'billing' }]])(
    'sends %o to the billing page',
    async (query) => {
      renderPage(query)

      await waitFor(() =>
        expect(nav.replace).toHaveBeenCalledWith('/ar/billing')
      )
      expect(screen.queryByRole('tablist')).toBeNull()
    }
  )
})

describe('SettingsStandalonePage unsaved changes', () => {
  it('marks the tab and shows the save bar only while there are changes', async () => {
    renderPage()
    const input = await storeNameInput()
    expect(saveBar()).toBeNull()
    expect(
      within(tab(/الرسالة/)).queryByText(copy.page.unsavedShort)
    ).toBeNull()

    fireEvent.change(input, { target: { value: 'متجر نور' } })

    expect(
      within(tab(/الرسالة/)).getByText(copy.page.unsavedShort)
    ).toBeTruthy()
    expect(within(saveBar()!).getByText(copy.page.saveBar.unsaved)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'تجاهل' }))

    expect(saveBar()).toBeNull()
    expect(
      within(tab(/الرسالة/)).queryByText(copy.page.unsavedShort)
    ).toBeNull()
    expect(input.value).toBe('Togo_Test_A')
  })

  it('leaves room under the last card only while the save bar shows', async () => {
    const { container } = renderPage()
    const input = await storeNameInput()
    const page = container.firstElementChild as HTMLElement
    expect(page.className).toContain('pb-8')

    fireEvent.change(input, { target: { value: 'متجر نور' } })

    expect(page.className).toContain('pb-44')
    expect(page.className).toContain('sm:pb-36')
    expect(page.className).not.toContain('pb-8')
  })

  it('names the tabs when more than one holds changes', async () => {
    const { goTo } = renderPage()
    fireEvent.change(await storeNameInput(), { target: { value: 'متجر نور' } })

    goTo('timing')
    fireEvent.click((await screen.findAllByRole('switch'))[0])

    expect(
      within(saveBar()!).getByText(
        'تغييرات غير محفوظة في: الرسالة، التوقيت والمتابعة'
      )
    ).toBeTruthy()
    expect(
      within(tab(/التوقيت والمتابعة/)).getByText(copy.page.unsavedShort)
    ).toBeTruthy()
  })

  it('saves, toasts and hides the bar', async () => {
    renderPage()
    fireEvent.change(await storeNameInput(), { target: { value: 'متجر نور' } })

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith({
        message: 'تم حفظ الإعدادات',
      })
    )
    expect(api.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ storeName: 'متجر نور' })
    )
    await waitFor(() => expect(saveBar()).toBeNull())
  })

  it('opens the tab of the first invalid field and focuses it', async () => {
    const { goTo } = renderPage()
    fireEvent.change(await storeNameInput(), { target: { value: '   ' } })
    goTo('timing')
    await screen.findAllByRole('switch')

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))

    await waitFor(() =>
      expect(nav.push).toHaveBeenCalledWith('/ar/settings?tab=message', {
        scroll: false,
      })
    )
    goTo('message')

    const input = await storeNameInput()
    await waitFor(() => expect(document.activeElement).toBe(input))
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('أدخل اسم المتجر.')).toBeTruthy()
    expect(screen.getByText(copy.messages.saveInvalid)).toBeTruthy()
    expect(api.saveSettings).not.toHaveBeenCalled()
  })

  it('shows the server failure in a banner, not a toast', async () => {
    api.saveSettings.mockRejectedValue(new Error('boom'))
    renderPage()
    fireEvent.change(await storeNameInput(), { target: { value: 'متجر نور' } })

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))

    expect(await screen.findByText(copy.messages.saveError)).toBeTruthy()
    expect(toast.error).not.toHaveBeenCalled()
    expect(saveBar()).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: copy.page.dismiss }))
    expect(screen.queryByText(copy.messages.saveError)).toBeNull()
  })
})

describe('SettingsStandalonePage states', () => {
  it('is read-only for a viewer: a notice, no editing, no save bar', async () => {
    api.fetchSettings.mockResolvedValue(
      settingsResponseFixture({
        state: {
          source: standaloneSource,
          permissions: {
            canUpdateConfiguration: false,
            canCompleteOnboarding: false,
          },
        },
      })
    )
    renderPage()
    const input = await storeNameInput()

    expect(screen.getByRole('status').textContent).toBe(copy.messages.readOnly)
    expect(input.disabled).toBe(true)
    expect(
      screen
        .getAllByRole('radio')
        .every((radio) => (radio as HTMLButtonElement).disabled)
    ).toBe(true)
    expect(
      screen.queryByRole('button', { name: copy.page.message.testSend })
    ).toBeNull()
    expect(saveBar()).toBeNull()
  })

  it('offers a retry when the settings cannot be loaded', async () => {
    api.fetchSettings.mockRejectedValueOnce(new Error('offline'))
    renderPage()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(copy.page.loadError.title)).toBeTruthy()

    fireEvent.click(
      within(alert).getByRole('button', { name: copy.page.loadError.retry })
    )

    expect(await storeNameInput()).toBeTruthy()
    expect(api.fetchSettings).toHaveBeenCalledTimes(2)
  })
})

describe('SettingsStandalonePage message tab', () => {
  it('sends a test only once the changes are saved', async () => {
    renderPage()
    const input = await storeNameInput()
    const send = screen.getByRole('button', {
      name: copy.page.message.testSend,
    }) as HTMLButtonElement

    expect(send.disabled).toBe(false)
    // The merchant's own number, grouped, as a left-to-right island.
    const phone = screen.getByText('+20 100 123 4567')
    expect(phone.tagName).toBe('BDI')
    expect(phone.getAttribute('dir')).toBe('ltr')

    fireEvent.change(input, { target: { value: 'متجر نور' } })

    expect(send.disabled).toBe(true)
    expect(screen.getByText(copy.page.message.testSendSaveFirst)).toBeTruthy()
    expect(screen.queryByText('+20 100 123 4567')).toBeNull()
    expect(screen.queryByRole('button', { name: promptCopy.change })).toBeNull()
  })

  it('sends straight to a saved number', async () => {
    onboarding.sendOnboardingTest.mockResolvedValue({})
    renderPage()
    await storeNameInput()

    fireEvent.click(
      screen.getByRole('button', { name: copy.page.message.testSend })
    )

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith({
        message: copy.messages.testSendSuccess,
      })
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(api.saveSettings).not.toHaveBeenCalled()
  })

  it('asks for the number when none is saved, then saves and sends', async () => {
    // The empty field opens on the browser's country.
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ar-EG'])
    onboarding.sendOnboardingTest.mockResolvedValue({})
    api.fetchSettings.mockResolvedValue(
      settingsResponseFixture({
        state: { source: standaloneSource, merchantWhatsappPhone: null },
      })
    )
    api.saveSettings.mockImplementation(async (payload) =>
      settingsResponseFixture({
        state: {
          source: standaloneSource,
          merchantWhatsappPhone: payload.merchantWhatsappPhone,
        },
      })
    )
    renderPage()
    await storeNameInput()
    expect(
      screen.getByText(ar.settings.embedded.message.testSendHelpNoPhone)
    ).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: copy.page.message.testSend })
    )

    const dialog = await screen.findByRole('dialog')
    expect(onboarding.sendOnboardingTest).not.toHaveBeenCalled()
    const field = within(dialog).getByLabelText(
      promptCopy.label
    ) as HTMLInputElement
    expect(within(dialog).queryByText(promptCopy.suggested)).toBeNull()

    // An empty number is refused in place.
    fireEvent.click(
      within(dialog).getByRole('button', { name: promptCopy.submit })
    )
    expect(within(dialog).getByRole('alert').textContent).toBe(
      promptCopy.invalid
    )
    expect(api.saveSettings).not.toHaveBeenCalled()

    fireEvent.change(field, { target: { value: '+20 100 123 4567' } })
    fireEvent.click(
      within(dialog).getByRole('button', { name: promptCopy.submit })
    )

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith({
        message: copy.messages.testSendSuccess,
      })
    )
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
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    // The panel now names the saved number.
    expect(screen.getByText('+20 100 123 4567').tagName).toBe('BDI')
  })

  it('starts from the store phone when there is one', async () => {
    api.fetchSettings.mockResolvedValue(
      settingsResponseFixture({
        state: {
          source: standaloneSource,
          merchantWhatsappPhone: null,
          shopPhone: '+971501234567',
        },
      })
    )
    renderPage()
    await storeNameInput()

    fireEvent.click(
      screen.getByRole('button', { name: copy.page.message.testSend })
    )

    const dialog = await screen.findByRole('dialog')
    const field = within(dialog).getByLabelText(
      promptCopy.label
    ) as HTMLInputElement
    expect(field.value.replace(/\s/g, '')).toBe('+971501234567')
    expect(within(dialog).getByText(promptCopy.suggested)).toBeTruthy()
  })

  it('changes a saved number from the panel', async () => {
    renderPage()
    await storeNameInput()

    fireEvent.click(screen.getByRole('button', { name: promptCopy.change }))

    const dialog = await screen.findByRole('dialog')
    const field = within(dialog).getByLabelText(
      promptCopy.label
    ) as HTMLInputElement
    expect(field.value.replace(/\s/g, '')).toBe('+201001234567')

    fireEvent.click(
      within(dialog).getByRole('button', { name: promptCopy.cancel })
    )

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(api.saveSettings).not.toHaveBeenCalled()
    expect(onboarding.sendOnboardingTest).not.toHaveBeenCalled()
  })

  it('previews the message in the language picked in the panel', async () => {
    renderPage()
    await storeNameInput()

    expect(preview().getAttribute('aria-label')).toContain('العربية')
    expect(preview().textContent).toContain('شكرًا لتسوّقك من Togo_Test_A')
    expect(preview().querySelector('[lang]')?.getAttribute('dir')).toBe('rtl')
    // The order number stays left to right inside the Arabic line.
    expect(within(preview()).getByText('#1009').getAttribute('dir')).toBe('ltr')

    previewIn('en')

    expect(previewLanguage().value).toBe('en')
    expect(preview().getAttribute('aria-label')).toContain('الإنجليزية')
    expect(preview().textContent).toContain(
      'Thank you for shopping with Togo_Test_A'
    )
    expect(preview().querySelector('[lang]')?.getAttribute('dir')).toBe('ltr')
    // The style cards follow: the English styles, with their default marked.
    const friendly = styleOption(/ودّي/)
    expect(friendly.selected).toBe(true)
    expect(friendly.textContent).toContain('الافتراضي')
  })

  it('switches the preview when a fixed message language is chosen', async () => {
    renderPage()
    await storeNameInput()
    const auto = screen.getByRole('radio', { name: /تلقائي حسب رقم العميل/ })
    expect(auto.getAttribute('aria-checked')).toBe('true')
    expect(within(auto).getByText('موصى به')).toBeTruthy()

    const messageCopy = ar.settings.embedded.message
    const fixed = screen.getByRole('radio', {
      name: new RegExp(messageCopy.languageFixed),
    })
    fireEvent.click(fixed)
    const language = screen.getByLabelText(
      messageCopy.languageFixedLabel
    ) as HTMLSelectElement
    // It starts on the language being previewed.
    expect(language.value).toBe('ar')
    fireEvent.change(language, { target: { value: 'en' } })

    expect(fixed.getAttribute('aria-checked')).toBe('true')
    expect(auto.getAttribute('aria-checked')).toBe('false')
    expect(preview().getAttribute('aria-label')).toContain('الإنجليزية')
    expect(
      within(tab(/الرسالة/)).getByText(copy.page.unsavedShort)
    ).toBeTruthy()
  })

  it('shows the live store name in the preview and picks a style', async () => {
    renderPage()
    fireEvent.change(await storeNameInput(), { target: { value: 'متجر نور' } })

    expect(preview().textContent).toContain('شكرًا لتسوّقك من متجر نور')

    const egyptian = styleOption(/مصري/)
    chooseStyle(egyptian)

    expect(egyptian.selected).toBe(true)
    expect(preview().textContent).toContain('مستني تأكيدك')
  })

  describe('message styles come from the settings response', () => {
    beforeEach(() => {
      api.fetchSettings.mockResolvedValue(
        allStylesSettingsFixture({ state: { source: standaloneSource } })
      )
    })

    it('lists every style the API returns under its label', async () => {
      renderPage()
      await storeNameInput()
      const labels = ar.settings.embedded.message.variantLabels

      for (const name of [
        labels.standard,
        labels.egyptian,
        labels.gulf,
        labels.short,
      ]) {
        expect(styleOption(name)).toBeTruthy()
      }
      // A style with no translation yet shows under its own id.
      expect(styleOption(/levantine/)).toBeTruthy()

      previewIn('en')

      for (const name of [
        labels.friendly,
        labels.professional,
        labels.direct,
        labels.short,
      ]) {
        expect(styleOption(name)).toBeTruthy()
      }
      expect(screen.queryByRole('option', { name: /levantine/ })).toBeNull()
    })

    it('saves a style this app has no list entry for', async () => {
      renderPage()
      await storeNameInput()

      const levantine = styleOption(/levantine/)
      chooseStyle(levantine)
      expect(levantine.selected).toBe(true)
      expect(preview().textContent).toContain('مرحبا levantine')

      fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))

      await waitFor(() =>
        expect(api.saveSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            codTemplateArVariant: 'levantine',
            codTemplateEnVariant: 'friendly',
          })
        )
      )
    })
  })
})

describe('SettingsStandalonePage message improvements', () => {
  const messageCopy = ar.settings.embedded.message
  const reminder = (variant: string, line: string) => ({
    language: 'ar' as const,
    variant,
    metaTemplateName: `akeed_cod_reminder_${variant}`,
    metaLanguageCode: 'ar',
    bodyParameterOrder: ['customer', 'order', 'store', 'total'] as Array<
      'customer' | 'store' | 'order' | 'total'
    >,
    message: templateMessageFixture([line], ['تأكيد', 'إلغاء'], {
      direction: 'rtl',
    }),
  })

  function offered() {
    const response = settingsResponseFixture({
      state: { source: standaloneSource },
    })
    return {
      ...response,
      template: {
        ...response.template,
        reminder: {
          selected: { ar: null, en: null },
          variants: {
            ar: [reminder('gulf_v1', 'تذكير {{customer}} بطلب #{{order}}')],
            en: [],
          },
        },
        arabicAuto: { selected: false },
      },
    }
  }

  it('offers neither choice unless the response does, and saves neither', async () => {
    renderPage()
    fireEvent.change(await storeNameInput(), { target: { value: 'متجر نور' } })

    expect(
      screen.queryByRole('radio', {
        name: new RegExp(messageCopy.reminderSame),
      })
    ).toBeNull()
    expect(
      screen.queryByRole('option', {
        name: new RegExp(messageCopy.variantLabels.auto),
      })
    ).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() => expect(api.saveSettings).toHaveBeenCalled())
    const [payload] = api.saveSettings.mock.calls[0] as [
      Record<string, unknown>,
    ]
    expect(payload).not.toHaveProperty('codReminderArVariant')
    expect(payload).not.toHaveProperty('codTemplateArAuto')
  })

  it('picks the automatic Arabic style and saves it, keeping the saved style', async () => {
    api.fetchSettings.mockResolvedValue(offered())
    renderPage()
    await storeNameInput()

    const auto = styleOption(messageCopy.variantLabels.auto)
    chooseStyle(auto)
    expect(auto.selected).toBe(true)
    expect(styleOption(/^فصحى/).selected).toBe(false)
    expect(screen.queryByText(messageCopy.autoStylePreviewNote)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() =>
      expect(api.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          codTemplateArAuto: true,
          codTemplateArVariant: 'standard',
          codReminderArVariant: null,
          codReminderEnVariant: null,
        })
      )
    )
  })

  it('offers no automatic style for English', async () => {
    api.fetchSettings.mockResolvedValue(offered())
    renderPage()
    await storeNameInput()
    previewIn('en')
    expect(
      screen.queryByRole('option', {
        name: new RegExp(messageCopy.variantLabels.auto),
      })
    ).toBeNull()
  })

  it('picks a reminder style, then same as the first message again', async () => {
    api.fetchSettings.mockResolvedValue(offered())
    renderPage()
    await storeNameInput()

    const same = screen.getByRole('radio', {
      name: new RegExp(messageCopy.reminderSame),
    })
    expect(same.getAttribute('aria-checked')).toBe('true')
    // The only version of its style on screen: named without its number.
    const gulf = screen.getByRole('radio', { name: /خليجي/ })
    expect(gulf.textContent).not.toContain('خليجي 1')
    expect(within(gulf).getByText(/تذكير أحمد بطلب #1009/)).toBeTruthy()
    fireEvent.click(gulf)
    expect(gulf.getAttribute('aria-checked')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() =>
      expect(api.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ codReminderArVariant: 'gulf_v1' })
      )
    )
  })

  it('renders a message read from Meta like any other, with its own replies', async () => {
    const response = settingsResponseFixture({
      state: { source: standaloneSource },
    })
    response.template.variants.ar[0].message = templateMessageFixture(
      ['هلا {{customer}}، طلبك #{{order}} من {{store}}'],
      ['نعم', 'لا'],
      { direction: 'rtl', source: 'provider' }
    )
    api.fetchSettings.mockResolvedValue(response)
    renderPage()
    await storeNameInput()

    expect(preview().textContent).toContain('هلا أحمد، طلبك')
    expect(within(preview()).getByText('#1009').getAttribute('dir')).toBe('ltr')
    expect(within(preview()).getByText('نعم')).toBeTruthy()
    expect(within(preview()).getByText('لا')).toBeTruthy()
  })

  it('adds Request a change to the preview while the switch is on', async () => {
    api.fetchSettings.mockResolvedValue(
      settingsResponseFixture({
        state: {
          source: standaloneSource,
          changeRequestsEnabled: false,
          changeRequestReadiness: { ready: true },
        },
      })
    )
    renderPage()
    await storeNameInput()
    expect(within(preview()).queryByText('طلب تعديل')).toBeNull()

    fireEvent.click(
      screen.getByRole('switch', { name: ar.settings.changeRequests.label })
    )
    expect(within(preview()).getByText('طلب تعديل')).toBeTruthy()

    fireEvent.click(
      screen.getByRole('switch', { name: ar.settings.changeRequests.label })
    )
    expect(within(preview()).queryByText('طلب تعديل')).toBeNull()
  })

  it('cannot turn on Request a change for a style without its template', async () => {
    const response = settingsResponseFixture({
      state: {
        source: standaloneSource,
        changeRequestsEnabled: false,
        changeRequestReadiness: { ready: true },
      },
    })
    response.template.variants.ar[0].changeRequest = false
    api.fetchSettings.mockResolvedValue(response)
    renderPage()
    await storeNameInput()
    const control = screen.getByRole('switch', {
      name: ar.settings.changeRequests.label,
    }) as HTMLButtonElement
    expect(control.disabled).toBe(true)
    expect(within(preview()).queryByText('طلب تعديل')).toBeNull()
  })

  it('shows bold as WhatsApp does, and the total as it is sent', async () => {
    const response = settingsResponseFixture({
      state: { source: standaloneSource },
    })
    response.template.variants.ar[0].message = templateMessageFixture(
      ['طلبك من *{{store}}* بإجمالي *{{total}}* يا {{customer}}'],
      ['نعم', 'لا'],
      { direction: 'rtl', source: 'provider' }
    )
    api.fetchSettings.mockResolvedValue(response)
    renderPage()
    await storeNameInput()

    const picture = preview()
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

  it('says so when a message has no text', async () => {
    const response = settingsResponseFixture({
      state: { source: standaloneSource },
    })
    response.template.variants.ar[0].message = templateMessageFixture(
      [],
      ['تأكيد', 'إلغاء'],
      { direction: 'rtl' }
    )
    api.fetchSettings.mockResolvedValue(response)
    renderPage()
    await storeNameInput()

    expect(within(preview()).getByText(messageCopy.previewEmpty)).toBeTruthy()
  })
})

describe('SettingsStandalonePage message languages', () => {
  const messageCopy = ar.settings.embedded.message
  const source = { state: { source: standaloneSource } }
  const always = (name: string) =>
    screen.getByRole('radio', { name: new RegExp(name) })
  const chooseOneLanguage = () =>
    fireEvent.click(always(messageCopy.languageFixed))
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

  it('previews in any of the six languages', async () => {
    renderPage()
    await storeNameInput()

    expect(
      Array.from(previewLanguage().options).map((option) => option.value)
    ).toEqual(['ar', 'en', 'ur', 'es', 'fr', 'tr'])
  })

  it('shows a language with no approved message, but does not let it be chosen', async () => {
    renderPage()
    await storeNameInput()

    // Automatic shows no list; one language for everyone does.
    expect(screen.queryByLabelText(messageCopy.languageFixedLabel)).toBeNull()
    chooseOneLanguage()

    expect(
      Array.from(oneLanguage().options).map((option) => option.value)
    ).toEqual(['ar', 'en', 'ur', 'es', 'fr', 'tr'])
    for (const language of ['ur', 'es', 'fr', 'tr']) {
      expect(languageOption(language).disabled).toBe(true)
      expect(languageOption(language).textContent).toContain(
        messageCopy.notEnabledYet
      )
    }
    expect(languageOption('ar').disabled).toBe(false)
    expect(languageOption('en').disabled).toBe(false)
    expect(languageOption('en').textContent).toBe(messageCopy.languageNames.en)
  })

  it('sends the test in the language being previewed', async () => {
    onboarding.sendOnboardingTest.mockResolvedValue({})
    renderPage()
    await storeNameInput()
    previewIn('en')

    // The helper names the number the test goes to.
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' && element.textContent.includes('+20')
      )
    ).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: copy.page.message.testSend })
    )

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
      name: copy.page.message.testSend,
    }) as HTMLButtonElement
    expect(send.disabled).toBe(true)
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
    expect(send.disabled).toBe(false)
  })

  it('previews the one language a store sends, with no second language list', async () => {
    onboarding.sendOnboardingTest.mockResolvedValue({})
    api.saveSettings.mockImplementation(async (payload) =>
      settingsResponseFixture({
        state: {
          source: standaloneSource,
          defaultLanguage: payload.defaultLanguage,
        },
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
      screen.queryByRole('combobox', {
        name: messageCopy.previewLanguageGroup,
      })
    ).toBeTruthy()
    fireEvent.mouseEnter(
      screen.getByRole('button', {
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

    expect(
      screen.queryByRole('combobox', {
        name: messageCopy.previewLanguageGroup,
      })
    ).toBeNull()
    expect(screen.queryByText(styleHint('en'))).toBeNull()
    expect(preview().getAttribute('aria-label')).toContain(
      messageCopy.languageNames.en
    )

    // Unsaved: the test would send the saved settings, so it waits.
    const send = () =>
      screen.getByRole('button', {
        name: copy.page.message.testSend,
      }) as HTMLButtonElement
    expect(send().disabled).toBe(true)
    expect(screen.getByText(copy.page.message.testSendSaveFirst)).toBeTruthy()
    fireEvent.click(send())
    expect(onboarding.sendOnboardingTest).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() => expect(send().disabled).toBe(false))
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
        state: { source: standaloneSource, defaultLanguage: 'ar' },
      })
    )
    renderPage()
    await storeNameInput()
    expect(
      screen.queryByRole('combobox', {
        name: messageCopy.previewLanguageGroup,
      })
    ).toBeNull()
    expect(preview().getAttribute('aria-label')).toContain(
      messageCopy.languageNames.ar
    )

    fireEvent.change(oneLanguage(), { target: { value: 'en' } })
    expect(preview().getAttribute('aria-label')).toContain(
      messageCopy.languageNames.en
    )

    fireEvent.click(screen.getByRole('button', { name: 'تجاهل' }))

    await waitFor(() =>
      expect(preview().getAttribute('aria-label')).toContain(
        messageCopy.languageNames.ar
      )
    )
  })

  it('says so when a language has no messages at all', async () => {
    renderPage()
    await storeNameInput()
    previewIn('es')

    expect(
      screen.getByText(
        messageCopy.stylesEmpty.replace(
          '{language}',
          messageCopy.languageNames.es
        )
      )
    ).toBeTruthy()
    expect(screen.queryByRole('radio', { name: /standard/ })).toBeNull()
  })

  it('lists messages that are not approved yet as locked, with their text', async () => {
    api.fetchSettings.mockResolvedValue(awaitingUrduSettingsFixture(source))
    renderPage()
    await storeNameInput()
    previewIn('ur')

    const inReview = styleOption(standardStyle)
    const notEnabled = styleOption(shortStyle)
    expect(
      inReview.textContent?.includes(messageCopy.awaitingApproval)
    ).toBeTruthy()
    expect(notEnabled.textContent).toContain(messageCopy.notEnabledYet)
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: messageCopy.styleHeading })
    )
    expect((await screen.findByRole('tooltip')).textContent).toContain(
      'السلام علیکم'
    )
    fireEvent.keyDown(document, { key: 'Escape' })

    for (const card of [inReview, notEnabled]) {
      expect(card.hasAttribute('disabled')).toBe(true)
      expect(card.selected).toBe(false)
    }
    expect(preview().querySelector('[lang]')?.getAttribute('dir')).toBe('rtl')
    expect(saveBar()).toBeNull()
  })

  it('lets a store choose a live language and one of its styles, and saves both', async () => {
    api.fetchSettings.mockResolvedValue(liveUrduSettingsFixture(source))
    renderPage()
    await storeNameInput()

    chooseOneLanguage()
    expect(languageOption('ur').disabled).toBe(false)
    fireEvent.change(oneLanguage(), { target: { value: 'ur' } })
    expect(oneLanguage().value).toBe('ur')
    // The preview and the style card follow the chosen language.
    // One language: the preview follows it, with no list of its own.
    expect(
      screen.queryByRole('combobox', {
        name: messageCopy.previewLanguageGroup,
      })
    ).toBeNull()
    expect(preview().getAttribute('aria-label')).toContain(
      messageCopy.languageNames.ur
    )

    const short = styleOption(shortStyle)
    expect(short.hasAttribute('disabled')).toBe(false)
    chooseStyle(short)
    expect(short.selected).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() => expect(api.saveSettings).toHaveBeenCalled())
    const [payload] = api.saveSettings.mock.calls[0] as [
      Record<string, unknown>,
    ]
    expect(payload).toMatchObject({
      defaultLanguage: 'ur',
      codTemplateUrVariant: 'short_v1',
      codTemplateArVariant: 'standard',
      codTemplateEnVariant: 'friendly',
    })
    // A language that is not live sends no choice.
    expect(payload).not.toHaveProperty('codTemplateEsVariant')
    expect(payload).not.toHaveProperty('codTemplateFrVariant')
  })

  it('keeps Turkish locked while its messages are only in review or not switched on', async () => {
    api.fetchSettings.mockResolvedValue(awaitingTurkishSettingsFixture(source))
    renderPage()
    await storeNameInput()

    previewIn('tr')

    const inReview = styleOption(standardStyle)
    const notEnabled = styleOption(shortStyle)
    expect(
      inReview.textContent?.includes(messageCopy.awaitingApproval)
    ).toBeTruthy()
    expect(notEnabled.textContent).toContain(messageCopy.notEnabledYet)
    for (const card of [inReview, notEnabled]) {
      expect(card.hasAttribute('disabled')).toBe(true)
      expect(card.selected).toBe(false)
    }
    expect(preview().querySelector('[lang]')?.getAttribute('dir')).toBe('ltr')

    chooseOneLanguage()
    expect(languageOption('tr').disabled).toBe(true)
  })

  it('offers both approved Turkish confirmations once Turkish is live, and saves the choice', async () => {
    api.fetchSettings.mockResolvedValue(liveTurkishSettingsFixture(source))
    renderPage()
    await storeNameInput()

    chooseOneLanguage()
    expect(languageOption('tr').disabled).toBe(false)
    fireEvent.change(oneLanguage(), { target: { value: 'tr' } })
    expect(preview().getAttribute('aria-label')).toContain(
      messageCopy.languageNames.tr
    )

    const standard = styleOption(standardStyle)
    const short = styleOption(shortStyle)
    expect(standard.hasAttribute('disabled')).toBe(false)
    expect(short.hasAttribute('disabled')).toBe(false)
    expect(standard.selected).toBe(true)
    chooseStyle(short)
    expect(short.selected).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    await waitFor(() => expect(api.saveSettings).toHaveBeenCalled())
    const [payload] = api.saveSettings.mock.calls[0] as [
      Record<string, unknown>,
    ]
    expect(payload).toMatchObject({
      defaultLanguage: 'tr',
      codTemplateTrVariant: 'short_v1',
    })
    expect(payload).not.toHaveProperty('codTemplateUrVariant')
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
    const help = screen.getByRole('button', {
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
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    expect(help.tagName).toBe('BUTTON')
    fireEvent.keyDown(document, { key: 'Escape' })
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
    expect(saveBar()).toBeNull()
  })

  it('keeps the store-name example current', async () => {
    renderPage()
    const input = await storeNameInput()
    fireEvent.change(input, { target: { value: 'Sample Store' } })
    fireEvent.mouseEnter(
      screen.getByRole('button', {
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
    const response = settingsResponseFixture({
      state: { source: standaloneSource },
    })
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
    fireEvent.mouseEnter(screen.getByRole('button', { name: label }))
    expect((await screen.findByRole('tooltip')).textContent).toContain(
      description
    )
  }
)

it('keeps contextual help available for read-only stores', async () => {
  api.fetchSettings.mockResolvedValue(
    settingsResponseFixture({
      state: {
        source: standaloneSource,

        permissions: {
          canUpdateConfiguration: false,
          canCompleteOnboarding: false,
        },
      },
    })
  )
  renderPage()
  expect((await storeNameInput()).disabled).toBe(true)
  const help = screen.getByRole('button', {
    name: ar.settings.embedded.message.languageAuto,
  })
  expect((help as HTMLButtonElement).disabled).toBe(false)
  fireEvent.mouseEnter(help)
  expect((await screen.findByRole('tooltip')).textContent).toBe(
    ar.settings.embedded.message.languageAutoHelp
  )
  expect(api.saveSettings).not.toHaveBeenCalled()
})

describe('standalone settings WhatsApp tab', () => {
  it('is not offered while connecting is unavailable and nothing is connected', async () => {
    renderPage({ tab: 'whatsapp' })
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith(
        expect.stringContaining('tab=message'),
        { scroll: false }
      )
    )
    // The URL is a stub here, so only the panel shows the tab was dropped.
    expect(
      screen.queryByRole('button', {
        name: ar.whatsappConnect.tab.connect.action,
      })
    ).toBeNull()
  })

  it('is offered while connecting is available, and holds the connect action', async () => {
    whatsapp.sender.mockResolvedValue({
      available: true,
      appId: '1',
      configId: '2',
      canConnect: true,
      sendingEnabled: true,
      permissions: { canDisconnect: true, canUpdateThankYou: true },
      alerts: [],
    })
    const { goTo } = renderPage()
    expect(
      await screen.findByRole('tab', { name: copy.page.tabs.whatsapp })
    ).toBeTruthy()
    goTo('whatsapp')
    expect(
      await screen.findByRole('button', {
        name: ar.whatsappConnect.tab.connect.action,
      })
    ).toBeTruthy()
    expect(saveBar()).toBeNull()
  })
})

it.each([null, 'retired_style'])(
  'preserves the saved style %s without choosing an option on render',
  async (selected) => {
    const response = settingsResponseFixture({
      state: { defaultLanguage: 'ar', source: standaloneSource },
    })
    response.template.selected.ar = selected
    api.fetchSettings.mockResolvedValue(response)
    renderPage()
    await storeNameInput()
    expect(styleSelect().value).toBe(selected ?? '')
    expect(styleSelect().selectedOptions[0].disabled).toBe(true)
    expect(saveBar()).toBeNull()
    expect(api.saveSettings).not.toHaveBeenCalled()
  }
)

it('discards a changed style and restores the saved dropdown value', async () => {
  renderPage()
  await storeNameInput()
  const initial = styleSelect().value
  chooseStyle(styleOption(ar.settings.embedded.message.variantLabels.egyptian))
  expect(styleSelect().value).toBe('egyptian')
  fireEvent.click(screen.getByRole('button', { name: 'تجاهل' }))
  await waitFor(() => expect(styleSelect().value).toBe(initial))
  expect(api.saveSettings).not.toHaveBeenCalled()
})
