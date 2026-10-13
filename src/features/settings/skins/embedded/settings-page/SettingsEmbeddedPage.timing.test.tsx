import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'
import { settingsResponseFixture } from '../../../testing/settingsFixture'
import { SettingsEmbeddedPage } from './SettingsEmbeddedPage'

type Locale = 'ar' | 'en'

const nav = vi.hoisted(() => ({
  locale: 'ar',
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
  useSearchParams: () => new URLSearchParams({ tab: 'timing' }),
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

const MESSAGES = { ar, en }
const copy = (locale: Locale) => MESSAGES[locale].settings.embedded.timing

type State = NonNullable<Parameters<typeof settingsResponseFixture>[0]>['state']

async function renderTiming(locale: Locale, state: State = {}) {
  nav.locale = locale
  api.fetchSettings.mockResolvedValue(settingsResponseFixture({ state }))
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
  const view = render(<SettingsEmbeddedPage />, { wrapper })
  await screen.findByText(copy(locale).timelineHeading)

  const flow = view.container.querySelector('ol') as HTMLOListElement
  return {
    ...view,
    steps: within(flow).getAllByRole('listitem'),
    /** The wait written on the line into each step. */
    pills: () =>
      [...flow.querySelectorAll('li > [aria-hidden="true"]')].map(
        (connector) => connector.textContent
      ),
    markers: () =>
      [...flow.querySelectorAll('[data-step-state]')].map((marker) =>
        marker.getAttribute('data-step-state')
      ),
    dashedMarkers: () =>
      [...flow.querySelectorAll('[data-step-state]')].map((marker) =>
        marker.className.includes('border-dashed')
      ),
    pressedIn: (group: string) =>
      within(screen.getByRole('group', { name: group }))
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-pressed') === 'true')
        .map((button) => button.textContent),
    segmentsIn: (group: string) =>
      within(screen.getByRole('group', { name: group }))
        .getAllByRole('button')
        .map((button) => button.textContent),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  api.saveSettings.mockImplementation(async () => settingsResponseFixture())
  window.shopify = shopify as unknown as typeof window.shopify
})

const EXPECTED = {
  ar: {
    allOn: ['فورًا', 'بعد 6 ساعات', 'بعد 12 ساعة'],
    reminderOff: ['فورًا', 'متوقف', 'بعد 18 ساعة'],
    off: 'متوقف',
    quietOff: 'متوقفة. فعّلها لتجنّب مراسلة العملاء ليلًا.',
    reminderCounts: 'تُحتسب التذكيرات ضمن رسائلك الشهرية.',
    alertHelp: 'ينتقل الطلب إلى «تحتاج إجراءك» في أكيد لتتابعه بنفسك.',
    preview: 'معاينة الرسالة',
    sendSegments: ['فورًا', '15 د', '1 س', '2 س', '4 س'],
    tenMinutes: '10 د',
  },
  en: {
    allOn: ['Immediately', 'After 6 hours', 'After 12 hours'],
    reminderOff: ['Immediately', 'Off', 'After 18 hours'],
    off: 'Off',
    quietOff: 'Off. Turn on to avoid messaging customers at night.',
    reminderCounts: 'Reminders count toward your monthly messages.',
    alertHelp:
      'The order moves to “Needs your action” in Akeed so you can follow up yourself.',
    preview: 'Preview message',
    sendSegments: ['Immediately', '15 min', '1 h', '2 h', '4 h'],
    tenMinutes: '10 min',
  },
} as const

describe.each(['ar', 'en'] as const)('embedded Timing tab (%s)', (locale) => {
  const expected = EXPECTED[locale]
  const timing = copy(locale)

  it('draws all four steps with the wait on each connector', async () => {
    const view = await renderTiming(locale)

    expect(view.steps).toHaveLength(4)
    expect(view.pills()).toEqual(expected.allOn)
    expect(view.markers()).toEqual(['on', 'on', 'on', 'on'])
    expect(view.dashedMarkers()).toEqual([false, false, false, false])
    // Icons only: no step numbers.
    expect(view.steps.map((step) => step.textContent).join(' ')).not.toMatch(
      /(^|\s)[123](\s|$)/
    )
    for (const step of Object.values(timing.steps)) {
      expect(within(view.steps[0].parentElement!).getByText(step)).toBeTruthy()
    }
  })

  it('keeps a switched-off reminder in place, dashed and marked off', async () => {
    const view = await renderTiming(locale, { followUpEnabled: false })

    expect(view.steps).toHaveLength(4)
    expect(view.pills()).toEqual(expected.reminderOff)
    expect(view.markers()).toEqual(['on', 'on', 'off', 'on'])
    expect(view.dashedMarkers()).toEqual([false, false, true, false])
    expect(
      within(view.steps[3]).getByText(timing.steps.needsAction)
    ).toBeTruthy()
    expect(screen.queryByText(expected.reminderCounts)).toBeNull()
  })

  it('keeps every later step when auto-confirmation is off', async () => {
    const view = await renderTiming(locale, { isAutoVerifyEnabled: false })

    expect(view.steps).toHaveLength(4)
    expect(view.pills()).toEqual([expected.off, expected.off, expected.off])
    expect(view.markers()).toEqual(['on', 'off', 'off', 'off'])
    expect(
      screen.queryByRole('group', { name: timing.sendTimeLabel })
    ).toBeNull()
  })

  it('summarises quiet hours when they are off, and shows the selects when on', async () => {
    const view = await renderTiming(locale, { quietHoursEnabled: false })

    expect(screen.getByText(expected.quietOff)).toBeTruthy()
    expect(screen.queryByLabelText(timing.quietFrom)).toBeNull()

    fireEvent.click(screen.getByLabelText(timing.quietLabel))
    expect(screen.queryByText(expected.quietOff)).toBeNull()
    expect(screen.getByLabelText(timing.quietFrom)).toBeTruthy()
    view.unmount()
  })

  it('says what the reminder and the alert do', async () => {
    await renderTiming(locale)

    expect(screen.getByText(expected.reminderCounts)).toBeTruthy()
    expect(screen.getByText(expected.alertHelp)).toBeTruthy()
  })

  it('links "Preview message" to the Message tab', async () => {
    await renderTiming(locale)

    const link = screen.getByRole('button', { name: expected.preview })
    expect(link.tabIndex).toBe(0)
    fireEvent.click(link)
    expect(nav.push).toHaveBeenCalledWith(`/${locale}/settings?tab=message`)
  })

  it('offers five send times and no custom field', async () => {
    const view = await renderTiming(locale)

    expect(view.segmentsIn(timing.sendTimeLabel)).toEqual(expected.sendSegments)
    expect(view.pressedIn(timing.sendTimeLabel)).toEqual([
      expected.sendSegments[0],
    ])
    expect(screen.queryByText(timing.sendPresets.custom)).toBeNull()
    expect(screen.queryByLabelText(timing.customDelayLabel)).toBeNull()
  })

  it('keeps a saved send time that is not one of the choices', async () => {
    const view = await renderTiming(locale, { sendDelayMinutes: 10 })

    expect(view.segmentsIn(timing.sendTimeLabel)).toHaveLength(6)
    expect(view.pressedIn(timing.sendTimeLabel)).toEqual([expected.tenMinutes])
  })
})

describe('embedded Timing tab send time', () => {
  it('saves the minutes of the chosen segment', async () => {
    const view = await renderTiming('ar')

    fireEvent.click(
      within(
        screen.getByRole('group', { name: copy('ar').sendTimeLabel })
      ).getByRole('button', { name: '2 س' })
    )
    expect(view.pills()[0]).toBe('بعد ساعتين')

    await act(async () => {
      fireEvent.click(screen.getByText('حفظ'))
    })

    expect(api.saveSettings).toHaveBeenCalledTimes(1)
    expect(api.saveSettings.mock.calls[0][0]).toMatchObject({
      sendDelayMinutes: 120,
    })
  })
})
