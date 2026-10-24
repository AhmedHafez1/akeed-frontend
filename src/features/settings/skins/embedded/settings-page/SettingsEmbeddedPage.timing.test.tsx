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
    alertHelp: 'ينقل الطلبات إلى «تحتاج إجراءك».',
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
    alertHelp: 'Moves orders to “Needs your action”.',
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
    // The automatic-cancellation name replaces the last one only while it is on.
    const { autoCancel, ...stepNames } = timing.steps
    for (const step of Object.values(stepNames)) {
      expect(within(view.steps[0].parentElement!).getByText(step)).toBeTruthy()
    }
    expect(screen.queryByText(autoCancel)).toBeNull()
  })

  it('names the last step after the automatic cancellation while it is on', async () => {
    const view = await renderTiming(locale, { autoCancelEnabled: true })

    expect(view.steps).toHaveLength(4)
    expect(
      within(view.steps[3]).getByText(timing.steps.autoCancel)
    ).toBeTruthy()
    expect(
      within(view.steps[3]).queryByText(timing.steps.needsAction)
    ).toBeNull()
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

  it.each([
    [true, 2, 4, { ar: '4 دقائق', en: '4 minutes' }],
    [false, 2, 2, { ar: 'دقيقتين', en: '2 minutes' }],
    [true, 30, 90, { ar: '90 دقيقة', en: '90 minutes' }],
    [true, 360, 1080, { ar: '18 ساعة', en: '18 hours' }],
  ] as const)(
    'shows the exact cancellation duration (reminder=%s, reminder minutes=%s, total=%s)',
    async (
      followUpEnabled,
      followUpDelayMinutes,
      escalationDelayMinutes,
      duration
    ) => {
      await renderTiming(locale, {
        autoCancelEnabled: true,
        followUpEnabled,
        followUpDelayMinutes,
        escalationDelayMinutes,
      })
      const deadline =
        locale === 'en'
          ? 'Order will be automatically cancelled after ' +
            duration.en +
            ' from the first message.'
          : 'سيُلغى الطلب تلقائيًا بعد ' + duration.ar + ' من الرسالة الأولى.'
      expect(screen.getByText(deadline)).toBeTruthy()
    }
  )

  it('updates minute delays before saving and preserves exact payload minutes', async () => {
    const view = await renderTiming(locale, {
      autoCancelEnabled: false,
      followUpDelayMinutes: 2,
      escalationDelayMinutes: 4,
    })
    const minuteLabel = locale === 'en' ? '2 min' : '2 د'
    expect(view.pressedIn(timing.reminderGroup)).toEqual([minuteLabel])
    expect(view.pressedIn(timing.alertGroup)).toEqual([minuteLabel])
    fireEvent.click(screen.getByLabelText(timing.autoCancel.label))
    fireEvent.click(screen.getByLabelText(timing.reminderLabel))
    expect(
      screen.getByText(
        locale === 'en'
          ? 'Order will be automatically cancelled after 2 minutes from the first message.'
          : 'سيُلغى الطلب تلقائيًا بعد دقيقتين من الرسالة الأولى.'
      )
    ).toBeTruthy()
    fireEvent.click(screen.getByLabelText(timing.reminderLabel))
    expect(
      screen.getByText(
        locale === 'en'
          ? 'Order will be automatically cancelled after 4 minutes from the first message.'
          : 'سيُلغى الطلب تلقائيًا بعد 4 دقائق من الرسالة الأولى.'
      )
    ).toBeTruthy()
    expect(api.saveSettings).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(screen.getByText(locale === 'en' ? 'Save' : 'حفظ'))
    })
    expect(api.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        autoCancelEnabled: true,
        followUpDelayMinutes: 2,
        escalationDelayMinutes: 4,
      })
    )
  })

  it('shows Shopify options only while automatic cancellation is enabled', async () => {
    await renderTiming(locale, { autoCancelEnabled: false })
    expect(screen.queryByLabelText(timing.autoCancel.restockLabel)).toBeNull()
    expect(screen.queryByLabelText(timing.autoCancel.notifyLabel)).toBeNull()
    fireEvent.click(screen.getByLabelText(timing.autoCancel.label))
    expect(screen.getByLabelText(timing.autoCancel.restockLabel)).toBeTruthy()
    expect(screen.getByLabelText(timing.autoCancel.notifyLabel)).toBeTruthy()
    expect(screen.queryByText(/WooCommerce/)).toBeNull()
    fireEvent.click(screen.getByLabelText(timing.autoCancel.label))
    expect(screen.queryByLabelText(timing.autoCancel.restockLabel)).toBeNull()
    expect(screen.queryByLabelText(timing.autoCancel.notifyLabel)).toBeNull()
  })

  it('keeps disabled-state guidance when escalation is off', async () => {
    await renderTiming(locale, {
      escalationEnabled: false,
      autoCancelEnabled: false,
    })
    expect(screen.getByLabelText(timing.autoCancel.label)).toHaveProperty(
      'disabled',
      true
    )
    expect(screen.getByText(timing.autoCancel.requiresEscalation)).toBeTruthy()
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
