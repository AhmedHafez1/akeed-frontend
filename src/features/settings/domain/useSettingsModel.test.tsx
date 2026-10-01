import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as onboardingApi from '@/features/onboarding/api/onboardingApi'
import { ApiError } from '@/shared/lib/http'
import { queryKeys } from '@/shared/query/keys'
import * as settingsApi from '../api/settingsApi'
import { settingsResponseFixture } from '../testing/settingsFixture'
import {
  useSettingsModel,
  type SettingsModelMessages,
} from './useSettingsModel'

vi.mock('../api/settingsApi', () => ({
  fetchSettings: vi.fn(),
  saveSettings: vi.fn(),
}))

vi.mock('@/features/onboarding/api/onboardingApi', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('@/features/onboarding/api/onboardingApi')
    >()
  return { ...original, sendOnboardingTest: vi.fn() }
})

const api = vi.mocked(settingsApi)
const sendOnboardingTest = vi.mocked(onboardingApi.sendOnboardingTest)

// Each message is its own key, so an assertion names the message it expects.
const messages: SettingsModelMessages = {
  saveSuccess: 'saveSuccess',
  saveInvalid: 'saveInvalid',
  saveError: 'saveError',
  readOnly: 'readOnly',
  testSendSuccess: 'testSendSuccess',
  testSendCooldown: 'testSendCooldown',
  testSendDailyLimit: 'testSendDailyLimit',
  testSendPhoneMissing: 'testSendPhoneMissing',
  testSendError: 'testSendError',
}

const adapter = {
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  onLoadingChange: vi.fn(),
}

function setup(options: { enabled?: boolean } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const view = renderHook(
    () =>
      useSettingsModel({ enabled: options.enabled ?? true, messages, adapter }),
    { wrapper }
  )
  return { ...view, queryClient }
}

async function setupLoaded() {
  const view = setup()
  await waitFor(() => expect(view.result.current.values).not.toBeNull())
  return view
}

beforeEach(() => {
  vi.clearAllMocks()
  api.fetchSettings.mockResolvedValue(settingsResponseFixture())
  api.saveSettings.mockImplementation(async (payload) =>
    settingsResponseFixture({ state: { storeName: payload.storeName } })
  )
})

describe('useSettingsModel', () => {
  describe('loading', () => {
    it('seeds the form from the response, in minutes', async () => {
      const { result } = await setupLoaded()

      expect(result.current.values).toMatchObject({
        storeName: 'Togo_Test_A',
        sendDelayChoice: 'now',
        followUpDelayMinutes: 360,
        escalationGapMinutes: 720,
      })
      expect(result.current.isPageLoading).toBe(false)
      expect(result.current.isDirty).toBe(false)
      expect(result.current.canUpdateConfiguration).toBe(true)
    })

    it('reports loading to the adapter until the form is ready', async () => {
      await setupLoaded()

      expect(adapter.onLoadingChange.mock.calls[0]).toEqual([true])
      await waitFor(() =>
        expect(adapter.onLoadingChange).toHaveBeenLastCalledWith(false)
      )
    })

    it('waits for the runtime mode before requesting', () => {
      const { result } = setup({ enabled: false })

      expect(api.fetchSettings).not.toHaveBeenCalled()
      expect(result.current.isPageLoading).toBe(true)
    })

    it('stops reporting loading when the load fails, and can retry', async () => {
      api.fetchSettings.mockRejectedValueOnce(new ApiError('down', 500))
      const { result } = setup()

      await waitFor(() => expect(result.current.isLoadError).toBe(true))
      expect(adapter.onLoadingChange).toHaveBeenLastCalledWith(false)

      act(() => result.current.retry())
      await waitFor(() => expect(result.current.values).not.toBeNull())
      expect(result.current.isLoadError).toBe(false)
    })

    it('stays loading while setup is unfinished', async () => {
      api.fetchSettings.mockResolvedValue(
        settingsResponseFixture({ state: { onboardingStatus: 'pending' } })
      )
      const { result } = await setupLoaded()

      expect(result.current.isPageLoading).toBe(true)
    })

    it('is read-only for a viewer', async () => {
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
      const { result } = await setupLoaded()

      expect(result.current.canUpdateConfiguration).toBe(false)
    })

    it('keeps unsaved edits when the cached response changes', async () => {
      const { result, queryClient } = await setupLoaded()
      act(() => result.current.update({ storeName: 'Edited' }))

      act(() => {
        queryClient.setQueryData(
          queryKeys.settings.detail(),
          settingsResponseFixture({ state: { storeName: 'From server' } })
        )
      })

      expect(result.current.values?.storeName).toBe('Edited')
    })
  })

  describe('editing', () => {
    it('tracks unsaved changes per tab, including Store', async () => {
      const { result } = await setupLoaded()

      act(() => result.current.update({ storeName: 'New name' }))
      expect([...result.current.dirtyTabs]).toEqual(['message'])

      act(() => result.current.update({ followUpDelayMinutes: 120 }))
      act(() => result.current.update({ assumeCodWhenPaymentMissing: true }))
      expect([...result.current.dirtyTabs].sort()).toEqual([
        'message',
        'store',
        'timing',
      ])
      expect(result.current.isDirty).toBe(true)
    })

    it('discards back to the saved values', async () => {
      const { result } = await setupLoaded()
      act(() => result.current.update({ storeName: '' }))
      await act(async () => {
        await result.current.save()
      })
      expect(result.current.errors.storeName).toBe('required')

      act(() => result.current.discard())

      expect(result.current.values?.storeName).toBe('Togo_Test_A')
      expect(result.current.errors).toEqual({})
      expect(result.current.saveError).toBeNull()
      expect(result.current.isDirty).toBe(false)
    })

    it('suggests the store time zone when quiet hours are first enabled', async () => {
      api.fetchSettings.mockResolvedValue(
        settingsResponseFixture({
          state: {
            quietHoursEnabled: false,
            timezone: 'Asia/Riyadh',
            shopTimezone: 'Africa/Cairo',
          },
        })
      )
      const { result } = await setupLoaded()

      act(() => result.current.setQuietHoursEnabled(true))

      expect(result.current.values).toMatchObject({
        quietHoursEnabled: true,
        timezone: 'Africa/Cairo',
      })
    })
  })

  describe('save', () => {
    it('rejects an invalid form without a request', async () => {
      const { result } = await setupLoaded()
      act(() => result.current.update({ storeName: '   ' }))

      let outcome: unknown
      await act(async () => {
        outcome = await result.current.save()
      })

      expect(outcome).toEqual({ ok: false, invalidField: 'storeName' })
      expect(api.saveSettings).not.toHaveBeenCalled()
      expect(result.current.errors.storeName).toBe('required')
      expect(result.current.saveError).toBe('saveInvalid')
      expect(adapter.notifyError).not.toHaveBeenCalled()

      // Editing the field clears its error and the banner.
      act(() => result.current.update({ storeName: 'Fixed' }))
      expect(result.current.errors.storeName).toBeUndefined()
      expect(result.current.saveError).toBeNull()
    })

    it('saves minutes, updates the cache and notifies', async () => {
      const { result, queryClient } = await setupLoaded()
      act(() =>
        result.current.update({
          storeName: 'New name',
          sendDelayChoice: 'after15m',
        })
      )

      let outcome: unknown
      await act(async () => {
        outcome = await result.current.save()
      })

      expect(outcome).toEqual({ ok: true })
      expect(api.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ storeName: 'New name', sendDelayMinutes: 15 })
      )
      expect(adapter.notifySuccess).toHaveBeenCalledWith('saveSuccess')
      expect(adapter.notifyError).not.toHaveBeenCalled()
      expect(
        queryClient.getQueryData<settingsApi.SettingsResponse>(
          queryKeys.settings.detail()
        )?.state.storeName
      ).toBe('New name')
      // The response is the new baseline.
      expect(result.current.isDirty).toBe(false)
      expect(result.current.isSaving).toBe(false)
    })

    it('keeps the edits and notifies when the request fails', async () => {
      api.saveSettings.mockRejectedValue(new ApiError('boom', 500))
      const { result } = await setupLoaded()
      act(() => result.current.update({ storeName: 'New name' }))

      let outcome: unknown
      await act(async () => {
        outcome = await result.current.save()
      })

      expect(outcome).toEqual({ ok: false, invalidField: null })
      expect(result.current.saveError).toBe('saveError')
      expect(adapter.notifyError).toHaveBeenCalledWith('saveError', 'save')
      expect(adapter.notifySuccess).not.toHaveBeenCalled()
      expect(result.current.values?.storeName).toBe('New name')
      expect(result.current.isDirty).toBe(true)

      act(() => result.current.dismissSaveError())
      expect(result.current.saveError).toBeNull()
    })

    it('says the account is read-only on a 403', async () => {
      api.saveSettings.mockRejectedValue(new ApiError('forbidden', 403))
      const { result } = await setupLoaded()

      await act(async () => {
        await result.current.save()
      })

      expect(result.current.saveError).toBe('readOnly')
      expect(adapter.notifyError).toHaveBeenCalledWith('readOnly', 'save')
    })

    it('maps a server rejection to its field', async () => {
      api.saveSettings.mockRejectedValue(
        new ApiError('bad zone', 400, 'SETTINGS_TIMEZONE_UNSUPPORTED')
      )
      const { result } = await setupLoaded()

      let outcome: unknown
      await act(async () => {
        outcome = await result.current.save()
      })

      expect(outcome).toEqual({ ok: false, invalidField: 'timezone' })
      expect(result.current.errors.timezone).toBe('unsupportedTimezone')
    })
  })

  describe('test send', () => {
    it('notifies when the test message is sent', async () => {
      sendOnboardingTest.mockResolvedValue(
        {} as Awaited<ReturnType<typeof onboardingApi.sendOnboardingTest>>
      )
      const { result } = await setupLoaded()

      await act(async () => {
        await result.current.sendTest()
      })

      expect(sendOnboardingTest).toHaveBeenCalledWith({ resend: true })
      expect(adapter.notifySuccess).toHaveBeenCalledWith('testSendSuccess')
      expect(result.current.isSendingTest).toBe(false)
    })

    it.each([
      ['ONBOARDING_TEST_COOLDOWN', 'testSendCooldown'],
      ['ONBOARDING_TEST_DAILY_LIMIT', 'testSendDailyLimit'],
      ['ONBOARDING_TEST_PHONE_MISSING', 'testSendPhoneMissing'],
      ['SOMETHING_ELSE', 'testSendError'],
      [null, 'testSendError'],
    ])('reports %s as %s', async (code, message) => {
      sendOnboardingTest.mockRejectedValue(
        new onboardingApi.OnboardingApiError('failed', 429, code)
      )
      const { result } = await setupLoaded()

      await act(async () => {
        await result.current.sendTest()
      })

      expect(adapter.notifyError).toHaveBeenCalledWith(message, 'testSend')
      expect(adapter.notifySuccess).not.toHaveBeenCalled()
      expect(result.current.isSendingTest).toBe(false)
    })
  })
})
