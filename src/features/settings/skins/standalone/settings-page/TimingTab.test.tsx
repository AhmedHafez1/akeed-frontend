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
import { SETTINGS_FIELD_ID } from '../../../domain/settingsForm'
import { settingsResponseFixture } from '../../../testing/settingsFixture'
import { SettingsStandalonePage } from './SettingsStandalonePage'

const nav = vi.hoisted(() => ({
  search: new URLSearchParams({ tab: 'timing' }),
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

const timing = ar.settings.embedded.timing
const page = ar.settings.standalone.page
const standaloneSource = {
  platformType: 'standalone',
  identity: 'org-1',
} as const

type StateOverrides = NonNullable<
  Parameters<typeof settingsResponseFixture>[0]
>['state']

async function renderTiming(state: StateOverrides = {}) {
  api.fetchSettings.mockResolvedValue(
    settingsResponseFixture({ state: { source: standaloneSource, ...state } })
  )
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
  await screen.findByRole('heading', { name: timing.timelineHeading })
  return view
}

const toggle = (name: string) => screen.getByRole('switch', { name })
const group = (name: string) => screen.getByRole('group', { name })
const pressedIn = (name: string) =>
  within(group(name))
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-pressed') === 'true')
    .map((button) => button.textContent)
const flowSteps = () =>
  within(screen.getByRole('list')).getAllByRole('listitem')
const saveButton = () => screen.getByRole('button', { name: 'حفظ' })

beforeEach(() => {
  vi.clearAllMocks()
  nav.search = new URLSearchParams({ tab: 'timing' })
  api.saveSettings.mockImplementation(async () =>
    settingsResponseFixture({ state: { source: standaloneSource } })
  )
})

describe('standalone Timing tab', () => {
  it('shows the three sections with the saved choices pressed', async () => {
    await renderTiming()

    for (const heading of [
      timing.autoHeading,
      timing.followHeading,
      timing.quietHeading,
    ]) {
      expect(
        screen.getByRole('heading', { level: 2, name: heading })
      ).toBeTruthy()
    }
    expect(toggle(timing.autoLabel).getAttribute('aria-checked')).toBe('true')
    expect(pressedIn(timing.sendTimeLabel)).toEqual([timing.sendPresets.now])
    expect(pressedIn(timing.reminderGroup)).toEqual(['6 س'])
    // Stored 18 h from the first message, shown as 12 h after the reminder.
    expect(pressedIn(timing.alertGroup)).toEqual(['12 س'])
    expect(screen.getByText(timing.fromReminder)).toBeTruthy()
    // Standalone has no Shopify tag to mention.
    expect(screen.queryByText(/شوبيفاي/)).toBeNull()
    expect(
      (screen.getByLabelText(timing.quietFrom) as HTMLSelectElement).value
    ).toBe('21:00')
    expect(
      (screen.getByLabelText(timing.timezoneLabel) as HTMLSelectElement).value
    ).toBe('Africa/Cairo')
  })

  it('redraws the flow on every edit, before saving', async () => {
    await renderTiming()
    expect(flowSteps()[2].textContent).toContain('بعد 6 ساعات')

    fireEvent.click(
      within(group(timing.reminderGroup)).getByRole('button', { name: '2 س' })
    )
    expect(flowSteps()[2].textContent).toContain('بعد ساعتين')

    fireEvent.click(toggle(timing.reminderLabel))

    expect(
      screen.queryByRole('group', { name: timing.reminderGroup })
    ).toBeNull()
    expect(within(flowSteps()[2]).getAllByText(timing.stepOff)).toBeTruthy()
    // The alert is now measured from the first message.
    expect(screen.getByText(timing.fromFirstMessage)).toBeTruthy()
    expect(screen.queryByText(timing.fromReminder)).toBeNull()
    expect(
      within(screen.getByRole('tab', { name: /التوقيت والمتابعة/ })).getByText(
        page.unsavedShort
      )
    ).toBeTruthy()
    expect(api.saveSettings).not.toHaveBeenCalled()
  })

  it('hides the send time and turns later steps off without auto-confirmation', async () => {
    await renderTiming()

    fireEvent.click(toggle(timing.autoLabel))

    expect(
      screen.queryByRole('group', { name: timing.sendTimeLabel })
    ).toBeNull()
    for (const step of flowSteps().slice(1)) {
      expect(within(step).getAllByText(timing.stepOff).length).toBeGreaterThan(
        0
      )
    }
  })

  it('keeps a stored delay that is not a preset as its own pressed segment', async () => {
    await renderTiming({
      followUpDelayMinutes: 180,
      escalationDelayMinutes: 480,
    })

    expect(pressedIn(timing.reminderGroup)).toEqual(['3 س'])
    expect(
      within(group(timing.reminderGroup))
        .getAllByRole('button')
        .map((button) => button.textContent)
    ).toEqual(['2 س', '3 س', '6 س', '12 س', '24 س'])
    expect(pressedIn(timing.alertGroup)).toEqual(['5 س'])
  })

  it('rejects an invalid custom delay on save and focuses the field', async () => {
    await renderTiming()
    expect(
      document.getElementById(SETTINGS_FIELD_ID.sendDelayCustom)
    ).toBeNull()

    fireEvent.click(
      within(group(timing.sendTimeLabel)).getByRole('button', {
        name: timing.sendPresets.custom,
      })
    )
    const input = screen.getByLabelText(
      page.timing.customDelayLabel
    ) as HTMLInputElement
    expect(input.id).toBe(SETTINGS_FIELD_ID.sendDelayCustom)
    expect(input.value).toBe('0')
    expect(screen.getByText(timing.customDelaySuffix)).toBeTruthy()

    fireEvent.change(input, { target: { value: '2000' } })
    fireEvent.click(saveButton())

    const error = await screen.findByText(timing.customDelayError)
    expect(error.getAttribute('role')).toBe('alert')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    await waitFor(() => expect(document.activeElement).toBe(input))
    expect(api.saveSettings).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '45' } })
    expect(screen.queryByText(timing.customDelayError)).toBeNull()
    expect(flowSteps()[1].textContent).toContain('بعد 45 دقيقة')

    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(api.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ sendDelayMinutes: 45 })
      )
    )
  })

  it('rejects quiet hours that start and end at the same time', async () => {
    await renderTiming()
    const from = screen.getByLabelText(timing.quietFrom) as HTMLSelectElement
    const to = screen.getByLabelText(timing.quietTo) as HTMLSelectElement
    expect(from.id).toBe(SETTINGS_FIELD_ID.quietHours)
    // Half-hour steps across the whole day.
    expect(within(from).getAllByRole('option')).toHaveLength(48)

    fireEvent.change(to, { target: { value: '21:00' } })
    fireEvent.click(saveButton())

    const error = await screen.findByText(timing.quietErrors.sameStartEnd)
    expect(error.getAttribute('role')).toBe('alert')
    expect(from.getAttribute('aria-invalid')).toBe('true')
    expect(to.getAttribute('aria-invalid')).toBe('true')
    await waitFor(() => expect(document.activeElement).toBe(from))
    expect(api.saveSettings).not.toHaveBeenCalled()

    fireEvent.change(to, { target: { value: '08:30' } })
    expect(screen.queryByText(timing.quietErrors.sameStartEnd)).toBeNull()
  })

  it('hides the quiet-hours selects and the flow note when quiet hours are off', async () => {
    await renderTiming()
    expect(screen.getByText(/الرسائل التي يحين موعدها/)).toBeTruthy()

    fireEvent.click(toggle(timing.quietLabel))

    expect(screen.queryByLabelText(timing.quietFrom)).toBeNull()
    expect(screen.queryByText(/الرسائل التي يحين موعدها/)).toBeNull()
  })

  it('starts from the store zone when quiet hours are first turned on', async () => {
    await renderTiming({
      quietHoursEnabled: false,
      timezone: 'Asia/Riyadh',
      shopTimezone: 'Europe/Istanbul',
    })

    fireEvent.click(toggle(timing.quietLabel))

    const zone = screen.getByLabelText(
      timing.timezoneLabel
    ) as HTMLSelectElement
    expect(zone.value).toBe('Europe/Istanbul')
    expect(within(zone).getAllByRole('option')[0].textContent).toBe(
      'Istanbul (توقيت المتجر)'
    )
  })

  it('disables every control for a viewer', async () => {
    await renderTiming({
      permissions: {
        canUpdateConfiguration: false,
        canCompleteOnboarding: false,
      },
    })

    expect(
      screen
        .getAllByRole('switch')
        .every((control) => (control as HTMLButtonElement).disabled)
    ).toBe(true)
    expect(
      (screen.getByLabelText(timing.quietFrom) as HTMLSelectElement).disabled
    ).toBe(true)
    expect(
      within(group(timing.reminderGroup))
        .getAllByRole('button')
        .every((button) => (button as HTMLButtonElement).disabled)
    ).toBe(true)
  })
})
