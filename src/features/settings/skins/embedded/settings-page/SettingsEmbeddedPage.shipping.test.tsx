import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { ApiError } from '@/shared/lib/http'
import type { TemplateMessage } from '@/shared/lib/templateMessage'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'
import type { SettingsResponse } from '../../../api/settingsApi'
import { settingsResponseFixture } from '../../../testing/settingsFixture'
import { SettingsEmbeddedPage } from './SettingsEmbeddedPage'

type Locale = 'ar' | 'en'

const nav = vi.hoisted(() => ({
  locale: 'en',
  tab: 'shipping',
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
  usePathname: () => `/${nav.locale}/settings`,
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  useSearchParams: () => new URLSearchParams({ tab: nav.tab }),
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
vi.mock('@/features/whatsapp-connect', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/whatsapp-connect')>()),
  useWhatsappSenderData: () => ({
    connection: null,
    isLoading: false,
    isError: false,
  }),
}))

const MESSAGES = { ar, en }
const copy = (locale: Locale) => MESSAGES[locale].settings.embedded.shipping

const SHIPPED: Record<'ar' | 'en', TemplateMessage> = {
  en: {
    lines: [
      [{ text: 'Hello ' }, { variable: 'customer' }, { text: ',' }],
      [
        { text: 'Your order ' },
        { variable: 'order' },
        { text: ' has been shipped.' },
      ],
      [{ variable: 'tracking' }],
    ],
    buttons: ['I’ll be home', 'Reschedule', 'Change address'],
    direction: 'ltr',
    source: 'registered',
  },
  ar: {
    lines: [
      [{ text: 'مرحبًا ' }, { variable: 'customer' }, { text: '،' }],
      [{ variable: 'tracking' }],
    ],
    buttons: ['سأكون في المنزل', 'تغيير الموعد', 'تغيير العنوان'],
    direction: 'rtl',
    source: 'registered',
  },
}

type State = Partial<SettingsResponse['state']>

function response(state: State, withShipping = true): SettingsResponse {
  const base = settingsResponseFixture({ state })
  if (!withShipping) return base
  return {
    ...base,
    shipping: {
      messages: {
        ar: SHIPPED.ar,
        en: SHIPPED.en,
        ur: null,
        es: null,
        fr: null,
        tr: null,
      },
      trackingSamples: {
        ar: 'للتتبع: 1Z999',
        en: 'Tracking: 1Z999',
        ur: 'ٹریکنگ: 1Z999',
        es: 'Seguimiento: 1Z999',
        fr: 'Suivi : 1Z999',
        tr: 'Kargo takibi: 1Z999',
      },
    },
  }
}

const ON: State = {
  shippingNotificationsEnabled: true,
  shippingFulfillmentTriggerEnabled: true,
  shippingTags: ['Shipped'],
  defaultLanguage: 'en',
}

async function renderPage(
  locale: Locale,
  state: State,
  options: { withShipping?: boolean; tab?: string } = {}
) {
  nav.locale = locale
  nav.tab = options.tab ?? 'shipping'
  api.fetchSettings.mockResolvedValue(
    response(state, options.withShipping ?? true)
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = locale
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="UTC"
    >
      <AppProvider i18n={enTranslations}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </AppProvider>
    </NextIntlClientProvider>
  )
  return render(<SettingsEmbeddedPage />, { wrapper })
}

/** Polaris also renders hidden copies of the tabs to measure them. */
function tabNames() {
  return [...new Set(screen.getAllByRole('tab').map((tab) => tab.textContent))]
}
const checkbox = (name: string) =>
  screen.getByRole('checkbox', { name }) as HTMLInputElement
/** Text an element shows, even when split by an isolating <bdi>. */
const textOf = (text: string) => (_: string, node: Element | null) =>
  node?.textContent === text &&
  [...(node?.children ?? [])].every((child) => child.textContent !== text)

beforeEach(() => {
  vi.clearAllMocks()
  window.shopify = shopify as unknown as typeof window.shopify
  api.saveSettings.mockImplementation(async (payload) =>
    response({ ...ON, ...payload })
  )
})

describe('Settings › Shipping', () => {
  it('is hidden, and its link lands on Message, when the backend sends no shipping fields', async () => {
    await renderPage('en', {}, { withShipping: false })
    await screen.findAllByRole('tab', {
      name: en.settings.embedded.tabs.message,
    })
    expect(tabNames()).not.toContain(en.settings.embedded.tabs.shipping)
    expect(nav.replace).toHaveBeenCalledWith('/en/settings?tab=message')
    expect(screen.queryByText(copy('en').masterLabel)).toBeNull()
  })

  it('is a tab after Timing when the backend sends the fields', async () => {
    await renderPage('en', ON)
    await screen.findByText(copy('en').masterLabel)
    expect(tabNames()).toEqual([
      en.settings.embedded.tabs.message,
      en.settings.embedded.tabs.timing,
      en.settings.embedded.tabs.shipping,
      en.settings.embedded.tabs.plan,
    ])
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('shows the switch, the triggers, the tags and the Shipped message with its billing line', async () => {
    await renderPage('en', ON)
    await screen.findByText(copy('en').masterLabel)
    expect(checkbox(copy('en').masterLabel).checked).toBe(true)
    expect(checkbox(copy('en').fulfillLabel).checked).toBe(true)
    expect(screen.getByText('Shipped')).toBeTruthy()
    const preview = screen.getByRole('img', { name: copy('en').previewLabel })
    expect(preview.textContent).toContain('Tracking: 1Z999')
    expect(within(preview).getByText('Reschedule')).toBeTruthy()
    expect(screen.getByText(copy('en').billingLine)).toBeTruthy()
  })

  it('hides the triggers while off and keeps the preview', async () => {
    await renderPage('en', { ...ON, shippingNotificationsEnabled: false })
    await screen.findByText(copy('en').masterLabel)
    expect(screen.queryByText(copy('en').fulfillLabel)).toBeNull()
    expect(
      screen.getByRole('img', { name: copy('en').previewLabel })
    ).toBeTruthy()
  })

  it('saves the switch, the trigger and the tags through the save bar', async () => {
    await renderPage('en', ON)
    const input = await screen.findByRole('textbox', {
      name: copy('en').tagsLabel,
    })
    fireEvent.change(input, { target: { value: '  Bosta ' } })
    fireEvent.click(screen.getByRole('button', { name: copy('en').add }))
    fireEvent.click(checkbox(copy('en').fulfillLabel))
    expect(tabNames()).toContain(`${en.settings.embedded.tabs.shipping} •`)
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: en.settings.embedded.save })
      )
    })
    expect(api.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingNotificationsEnabled: true,
        shippingFulfillmentTriggerEnabled: false,
        shippingTags: ['Shipped', 'Bosta'],
      })
    )
  })

  it('removes a tag with its chip', async () => {
    await renderPage('en', ON)
    await screen.findByText('Shipped')
    fireEvent.click(checkbox(copy('en').fulfillLabel))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Shipped' }))
    expect(screen.queryByText('Shipped')).toBeNull()
    // Neither trigger is left: one caution line says so.
    expect(screen.getByText(copy('en').noTrigger)).toBeTruthy()
  })

  it.each([
    ['Akeed: Confirmed', 'reserved'],
    ['shipped', 'duplicate'],
    ['x'.repeat(41), 'tooLong'],
  ] as const)('refuses %s inline (%s)', async (value, error) => {
    await renderPage('en', ON)
    const input = await screen.findByRole('textbox', {
      name: copy('en').tagsLabel,
    })
    fireEvent.change(input, { target: { value } })
    fireEvent.keyDown(input, { key: 'Enter' })
    const message = copy('en').tagErrors[error].replace(/<\/?tag>/g, '')
    expect(await screen.findByText(textOf(message))).toBeTruthy()
    // The refused tag was not added: one chip still.
    expect(screen.getAllByText('Shipped')).toHaveLength(1)
  })

  it('refuses an eleventh tag', async () => {
    await renderPage('en', {
      ...ON,
      shippingTags: Array.from({ length: 10 }, (_, i) => `T${i}`),
    })
    const input = await screen.findByRole('textbox', {
      name: copy('en').tagsLabel,
    })
    fireEvent.change(input, { target: { value: 'Eleven' } })
    fireEvent.click(screen.getByRole('button', { name: copy('en').add }))
    expect(screen.getByText(copy('en').tagErrors.tooMany)).toBeTruthy()
  })

  it('shows the server tag refusal under the field', async () => {
    api.saveSettings.mockRejectedValue(
      new ApiError('bad tags', 400, 'SETTINGS_SHIPPING_TAGS_INVALID')
    )
    await renderPage('en', ON)
    await screen.findByText(copy('en').fulfillLabel)
    fireEvent.click(checkbox(copy('en').fulfillLabel))
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: en.settings.embedded.save })
      )
    })
    expect(await screen.findByText(copy('en').tagErrors.invalid)).toBeTruthy()
  })

  it('is read-only for a viewer', async () => {
    await renderPage('en', {
      ...ON,
      permissions: { canUpdateConfiguration: false },
    } as State)
    await screen.findByText(copy('en').masterLabel)
    expect(checkbox(copy('en').masterLabel).disabled).toBe(true)
    expect(checkbox(copy('en').fulfillLabel).disabled).toBe(true)
    expect(
      (
        screen.getByRole('textbox', {
          name: copy('en').tagsLabel,
        }) as HTMLInputElement
      ).disabled
    ).toBe(true)
    expect(screen.queryByRole('button', { name: 'Remove Shipped' })).toBeNull()
    expect(screen.getByText(en.settings.embedded.readOnly)).toBeTruthy()
  })

  it('reads right to left in Arabic, previewing the Arabic message', async () => {
    await renderPage('ar', { ...ON, defaultLanguage: 'ar' })
    const preview = await screen.findByRole('img', {
      name: copy('ar').previewLabel,
    })
    expect(document.documentElement.dir).toBe('rtl')
    expect(preview.textContent).toContain('للتتبع: 1Z999')
    expect(within(preview).getByText('تغيير العنوان')).toBeTruthy()
    expect(screen.getByText(copy('ar').billingLine)).toBeTruthy()
  })
})
