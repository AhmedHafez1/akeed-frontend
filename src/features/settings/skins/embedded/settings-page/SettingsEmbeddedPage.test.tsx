import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import { settingsResponseFixture } from '../../../testing/settingsFixture'
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

const SAVE_BAR_ID = 'akeed-settings-save-bar'

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
  return (await screen.findByLabelText(/اسم المتجر/)) as HTMLInputElement
}

function lastSaveBarCall() {
  const shows = shopify.saveBar.show.mock.invocationCallOrder.at(-1) ?? 0
  const hides = shopify.saveBar.hide.mock.invocationCallOrder.at(-1) ?? 0
  return shows > hides ? 'shown' : 'hidden'
}

beforeEach(() => {
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
    expect(screen.getAllByText('مقترحة لك')).toHaveLength(1)
    expect(screen.getByText(/أرسلت 28 رسالة في آخر 30 يوماً/)).toBeTruthy()
    expect(shopify.saveBar.show).not.toHaveBeenCalled()
  })

  it('does not redirect a current tab id', async () => {
    renderPage('timing')
    await screen.findByText('ماذا يحدث مع كل طلب دفع عند الاستلام')
    expect(nav.replace).not.toHaveBeenCalled()
  })
})
