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
import { settingsResponseFixture } from '../../../testing/settingsFixture'
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

const copy = ar.settings.standalone
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

async function storeNameInput() {
  return (await screen.findByLabelText(/اسم المتجر/)) as HTMLInputElement
}

const tab = (name: string | RegExp) => screen.getByRole('tab', { name })
const saveBar = () =>
  screen.queryByRole('region', { name: copy.page.saveBar.label })
const preview = () => screen.getByRole('img')

beforeEach(() => {
  vi.clearAllMocks()
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
    expect(screen.getByText(copy.page.subtitle)).toBeTruthy()
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
    await screen.findByRole('switch')

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

    expect(nav.push).toHaveBeenCalledWith('/ar/settings?tab=store', {
      scroll: false,
    })
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

  it('names the tabs when more than one holds changes', async () => {
    const { goTo } = renderPage()
    fireEvent.change(await storeNameInput(), { target: { value: 'متجر نور' } })

    goTo('timing')
    fireEvent.click(await screen.findByRole('switch'))

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
    await screen.findByRole('switch')

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
  })

  it('previews the message in the language picked in the panel', async () => {
    renderPage()
    await storeNameInput()

    expect(preview().getAttribute('aria-label')).toContain('العربية')
    expect(preview().textContent).toContain('شكرًا لتسوّقك من Togo_Test_A')
    expect(preview().querySelector('[lang]')?.getAttribute('dir')).toBe('rtl')
    // The order number stays left to right inside the Arabic line.
    expect(within(preview()).getByText('#1009').getAttribute('dir')).toBe('ltr')

    const english = screen.getByRole('button', { name: 'الإنجليزية' })
    fireEvent.click(english)

    expect(english.getAttribute('aria-pressed')).toBe('true')
    expect(preview().getAttribute('aria-label')).toContain('الإنجليزية')
    expect(preview().textContent).toContain(
      'Thank you for shopping with Togo_Test_A'
    )
    expect(preview().querySelector('[lang]')?.getAttribute('dir')).toBe('ltr')
    // The style cards follow: the English styles, with their default marked.
    const friendly = screen.getByRole('radio', { name: /ودّي/ })
    expect(friendly.getAttribute('aria-checked')).toBe('true')
    expect(within(friendly).getByText('الافتراضي')).toBeTruthy()
  })

  it('switches the preview when a fixed message language is chosen', async () => {
    renderPage()
    await storeNameInput()
    const auto = screen.getByRole('radio', { name: /تلقائي حسب رقم العميل/ })
    expect(auto.getAttribute('aria-checked')).toBe('true')
    expect(within(auto).getByText('موصى به')).toBeTruthy()

    fireEvent.click(screen.getByRole('radio', { name: 'الإنجليزية دائمًا' }))

    expect(
      screen
        .getByRole('radio', { name: 'الإنجليزية دائمًا' })
        .getAttribute('aria-checked')
    ).toBe('true')
    expect(preview().getAttribute('aria-label')).toContain('الإنجليزية')
    expect(
      within(tab(/الرسالة/)).getByText(copy.page.unsavedShort)
    ).toBeTruthy()
  })

  it('shows the live store name in the preview and picks a style', async () => {
    renderPage()
    fireEvent.change(await storeNameInput(), { target: { value: 'متجر نور' } })

    expect(preview().textContent).toContain('شكرًا لتسوّقك من متجر نور')

    const egyptian = screen.getByRole('radio', { name: /مصري/ })
    fireEvent.click(egyptian)

    expect(egyptian.getAttribute('aria-checked')).toBe('true')
    expect(preview().textContent).toContain('مستني تأكيدك')
  })
})
