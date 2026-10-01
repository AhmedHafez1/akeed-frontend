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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import { settingsResponseFixture } from '../../../testing/settingsFixture'
import { SettingsStandalonePage } from './SettingsStandalonePage'

const nav = vi.hoisted(() => ({
  search: new URLSearchParams({ tab: 'store' }),
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

const store = ar.settings.standalone.page.store
const page = ar.settings.standalone.page
const IDENTITY = 'akd_src_7f3c19e2b04a'
const standaloneSource = {
  platformType: 'standalone',
  identity: IDENTITY,
} as const

const writeText = vi.fn()

async function renderStore() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  document.documentElement.dir = 'rtl'
  document.documentElement.lang = 'ar'
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  )
  const view = render(<SettingsStandalonePage />, { wrapper })
  await screen.findByRole('heading', { name: store.codHeading })
  return view
}

const codSwitch = () => screen.getByRole('switch', { name: store.codLabel })
const copyButton = () => screen.getByRole('button', { name: store.copy })

beforeEach(() => {
  vi.clearAllMocks()
  nav.search = new URLSearchParams({ tab: 'store' })
  writeText.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  api.fetchSettings.mockResolvedValue(
    settingsResponseFixture({ state: { source: standaloneSource } })
  )
  api.saveSettings.mockImplementation(async (payload) =>
    settingsResponseFixture({
      state: {
        source: standaloneSource,
        assumeCodWhenPaymentMissing: payload.assumeCodWhenPaymentMissing,
      },
    })
  )
})

afterEach(() => {
  vi.useRealTimers()
})

describe('standalone Store tab', () => {
  it('shows the connected source and its id, left to right', async () => {
    await renderStore()

    expect(
      screen.getByRole('heading', { level: 2, name: 'مصدر الطلبات' })
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 3, name: 'مصدر مستقل / يدوي' })
    ).toBeTruthy()
    expect(screen.getByText(store.sourceHelp)).toBeTruthy()
    expect(screen.getByText('متصل')).toBeTruthy()
    expect(screen.getByText('معرّف الاتصال')).toBeTruthy()
    const id = screen.getByText(IDENTITY)
    expect(id.tagName).toBe('CODE')
    expect(id.getAttribute('dir')).toBe('ltr')
    // The theme is switched from the top bar, not from Settings.
    expect(screen.queryByText('المظهر')).toBeNull()
  })

  it('names the platform when the source is not the standalone one', async () => {
    api.fetchSettings.mockResolvedValue(
      settingsResponseFixture({
        state: { source: { platformType: 'easyorders', identity: 'shop-9' } },
      })
    )
    await renderStore()

    expect(
      screen.getByRole('heading', { level: 3, name: 'easyorders' })
    ).toBeTruthy()
  })

  it('copies the id and says so for two seconds', async () => {
    await renderStore()
    vi.useFakeTimers()

    await act(async () => {
      fireEvent.click(copyButton())
    })

    expect(writeText).toHaveBeenCalledWith(IDENTITY)
    expect(screen.getByRole('button', { name: 'تم النسخ' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: store.copy })).toBeNull()

    act(() => {
      vi.advanceTimersByTime(1999)
    })
    expect(screen.getByRole('button', { name: 'تم النسخ' })).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(copyButton()).toBeTruthy()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('reports a failed copy in a toast and keeps the button as it was', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    await renderStore()

    fireEvent.click(copyButton())

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith({ message: store.copyError })
    )
    expect(copyButton()).toBeTruthy()
    logged.mockRestore()
  })

  it('warns about prepaid orders only while missing payment counts as COD', async () => {
    await renderStore()
    expect(codSwitch().getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText(store.codHelp)).toBeTruthy()
    expect(screen.queryByText(store.codRisk)).toBeNull()

    fireEvent.click(codSwitch())

    expect(codSwitch().getAttribute('aria-checked')).toBe('true')
    expect(
      screen.getByText(
        'ستصل رسالة تأكيد أيضًا للطلبات المدفوعة مسبقًا التي تنقصها معلومات الدفع، وتُخصم من رصيدك.'
      )
    ).toBeTruthy()
    expect(
      within(screen.getByRole('tab', { name: /المتجر/ })).getByText(
        page.unsavedShort
      )
    ).toBeTruthy()

    fireEvent.click(codSwitch())
    expect(screen.queryByText(store.codRisk)).toBeNull()
    expect(
      within(screen.getByRole('tab', { name: /المتجر/ })).queryByText(
        page.unsavedShort
      )
    ).toBeNull()
  })

  it('saves the rule with the rest of the form', async () => {
    await renderStore()
    fireEvent.click(codSwitch())

    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }))

    await waitFor(() =>
      expect(api.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ assumeCodWhenPaymentMissing: true })
      )
    )
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: page.saveBar.label })
      ).toBeNull()
    )
    expect(codSwitch().getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText(store.codRisk)).toBeTruthy()
  })

  it('lets a viewer copy the id but not change the rule', async () => {
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
    await renderStore()

    expect((codSwitch() as HTMLButtonElement).disabled).toBe(true)
    expect((copyButton() as HTMLButtonElement).disabled).toBe(false)
  })
})
