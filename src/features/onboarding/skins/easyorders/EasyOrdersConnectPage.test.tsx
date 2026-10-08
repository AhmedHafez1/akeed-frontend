import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as onboardingApi from '@/features/onboarding/api/onboardingApi'
import type { IntegrationOnboardingState } from '@/features/onboarding/domain/onboarding.types'
import { renderOnboardingStandalone } from '@/features/onboarding/ui/standalone/components/onboardingTestUtils'
import { ApiError } from '@/shared/lib/http'
import {
  disconnectEasyOrders,
  fetchEasyOrdersConnection,
  saveEasyOrdersOrderSettings,
  saveEasyOrdersWebhookSecrets,
  startEasyOrdersInstall,
} from './easyOrdersApi'
import { EasyOrdersConnectPage } from './EasyOrdersConnectPage'
import {
  buildEasyOrdersChecklist,
  resolveEasyOrdersConnectView,
  type EasyOrdersConnectionStatus,
} from './easyOrders.types'

vi.mock('./easyOrdersApi', () => ({
  disconnectEasyOrders: vi.fn(),
  fetchEasyOrdersConnection: vi.fn(),
  saveEasyOrdersOrderSettings: vi.fn(),
  resetEasyOrdersWebhookSecrets: vi.fn(),
  saveEasyOrdersWebhookSecrets: vi.fn(),
  startEasyOrdersInstall: vi.fn(),
}))

// The connected store's steps read the onboarding state and the message.
vi.mock('@/features/onboarding/api/onboardingApi', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('@/features/onboarding/api/onboardingApi')
    >()
  return {
    ...original,
    fetchOnboardingState: vi.fn(),
    fetchTemplatePreviews: vi.fn(),
    updateOnboardingSettings: vi.fn(),
    sendOnboardingTest: vi.fn(),
    fetchOnboardingTest: vi.fn(),
    skipOnboardingTest: vi.fn(),
    completeStandaloneOnboarding: vi.fn(),
  }
})

const onboarding = vi.mocked(onboardingApi)
const disconnect = vi.mocked(disconnectEasyOrders)
const fetchStatus = vi.mocked(fetchEasyOrdersConnection)
const saveSecrets = vi.mocked(saveEasyOrdersWebhookSecrets)
const saveSettings = vi.mocked(saveEasyOrdersOrderSettings)
const startInstall = vi.mocked(startEasyOrdersInstall)

const INSTALL_URL =
  'https://app.easy-orders.net/#/install-app?callback_url=https%3A%2F%2Fapi.akeed.test%2Fapi%2Feasyorders%2Finstall%2Fcallback%2FCALLBACK-TOKEN-VALUE'

function status(
  overrides: Partial<EasyOrdersConnectionStatus> = {}
): EasyOrdersConnectionStatus {
  return {
    state: 'ready',
    canManage: true,
    organizationName: 'متجر نور',
    expiresAt: null,
    lastErrorCode: null,
    connection: null,
    ...overrides,
  }
}

const connected = (
  connection: Partial<
    NonNullable<EasyOrdersConnectionStatus['connection']>
  > = {}
) =>
  status({
    state: 'connected',
    connection: {
      storeId: 'store-7f3a',
      storeVerified: false,
      health: 'ok',
      webhookUrlHint: 'aB3_xZ',
      ordersSecretSet: false,
      statusSecretSet: false,
      currency: null,
      phoneCountry: null,
      rejectedDeliveries: 0,
      connectedAt: '2026-10-03T10:00:00.000Z',
      disconnectedAt: null,
      providerCleanup: null,
      ...connection,
    },
  })

const ready = { currency: 'EGP', phoneCountry: 'EG' } as const
const withSecrets = { ordersSecretSet: true, statusSecretSet: true } as const

/** What a disconnect leaves: the store, no address and no secrets. */
const disconnected = (overrides: Partial<EasyOrdersConnectionStatus> = {}) => ({
  ...connected({
    ...ready,
    webhookUrlHint: null,
    disconnectedAt: '2026-10-03T12:00:00.000Z',
  }),
  state: 'disconnected' as const,
  ...overrides,
})

function onboardingState(
  overrides: Partial<IntegrationOnboardingState> = {}
): IntegrationOnboardingState {
  return {
    integrationId: 'source-1',
    source: { platformType: 'easyorders', identity: 'easyorders:org' },
    onboardingStatus: 'pending',
    isOnboardingComplete: false,
    storeName: 'متجر نور',
    defaultLanguage: 'auto',
    isAutoVerifyEnabled: true,
    assumeCodWhenPaymentMissing: false,
    shippingCurrency: 'USD',
    avgShippingCost: 0,
    billingPlanId: 'starter',
    billingStatus: 'not_required',
    followUpEnabled: true,
    followUpDelayMinutes: 120,
    escalationEnabled: true,
    escalationDelayMinutes: 360,
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'Africa/Cairo',
    sendDelayMinutes: 0,
    merchantWhatsappPhone: null,
    permissions: { canUpdateConfiguration: true, canCompleteOnboarding: true },
    standaloneSetup: null,
    sourceSetup: {
      connectionState: 'connected',
      disconnectedAt: null,
      store: { reference: 'store-7f3a', verified: false },
      orderDefaults: { currency: null, phoneCountry: null },
      sender: { sender: 'akeed_shared', status: 'configured' },
      canComplete: false,
      blockedReasons: ['order_defaults_missing', 'webhook_secrets_missing'],
    },
    ...overrides,
  }
}

const readySetup = (
  sender: 'configured' | 'not_configured' | 'unknown' = 'configured'
) =>
  onboardingState({
    sourceSetup: {
      connectionState: 'connected',
      disconnectedAt: null,
      store: { reference: 'store-7f3a', verified: false },
      orderDefaults: { currency: 'EGP', phoneCountry: 'EG' },
      sender: { sender: 'akeed_shared', status: sender },
      canComplete: true,
      blockedReasons: [],
    },
  })

function mountPage(locale: 'ar' | 'en' = 'ar') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return renderOnboardingStandalone(
    <QueryClientProvider client={queryClient}>
      <EasyOrdersConnectPage />
    </QueryClientProvider>,
    locale
  )
}

async function renderPage(
  initial: EasyOrdersConnectionStatus,
  locale: 'ar' | 'en' = 'ar'
) {
  fetchStatus.mockResolvedValue(initial)
  const view = mountPage(locale)
  await screen.findByRole('heading', { level: 1 })
  return view
}

describe('EasyOrdersConnectPage', () => {
  let openedTab: {
    opener: unknown
    location: { replace: ReturnType<typeof vi.fn> }
    close: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    openedTab = {
      opener: window,
      location: { replace: vi.fn() },
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(openedTab as unknown as Window)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    onboarding.fetchOnboardingState.mockResolvedValue({
      state: onboardingState(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('connect', () => {
    it.each([
      [
        'ar',
        'اربط متجر نور مع EasyOrders',
        'قراءة طلباتك الجديدة',
        'تصل رسائل التأكيد إلى عملائك من رقم واتساب الخاص بأكيد.',
        'ربط EasyOrders',
      ],
      [
        'en',
        'Connect متجر نور to EasyOrders',
        'Read your new orders',
        'Confirmation messages reach your customers from Akeed’s WhatsApp number.',
        'Connect EasyOrders',
      ],
    ] as const)(
      'names the store, the two permissions and the Akeed sender in %s',
      async (locale, title, permission, sender, cta) => {
        await renderPage(status(), locale)

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
          title
        )
        expect(screen.getByText(permission)).toBeTruthy()
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
        expect(screen.getByText(sender)).toBeTruthy()
        expect(screen.getByRole('button', { name: cta })).toBeTruthy()
        expect(document.documentElement.dir).toBe(
          locale === 'ar' ? 'rtl' : 'ltr'
        )
      }
    )

    it('opens EasyOrders in a new tab and waits, without putting the link on the page', async () => {
      const view = await renderPage(status())
      startInstall.mockResolvedValue({
        installUrl: INSTALL_URL,
        expiresAt: '2026-10-03T10:15:00.000Z',
      })
      fetchStatus.mockResolvedValue(
        status({ state: 'pending', expiresAt: '2026-10-03T10:15:00.000Z' })
      )

      fireEvent.click(screen.getByRole('button', { name: 'ربط EasyOrders' }))

      await screen.findByRole('heading', {
        level: 1,
        name: 'أكمل الخطوة في EasyOrders',
      })
      expect(startInstall).toHaveBeenCalledWith('ar')
      expect(window.open).toHaveBeenCalledWith('', '_blank')
      expect(openedTab.opener).toBeNull()
      expect(openedTab.location.replace).toHaveBeenCalledWith(INSTALL_URL)
      expect(view.container.innerHTML).not.toContain('CALLBACK-TOKEN-VALUE')
      expect(view.container.innerHTML).not.toContain('install-app')
    })

    it('closes the tab and explains when the install cannot be started', async () => {
      await renderPage(status())
      startInstall.mockRejectedValue(
        new ApiError('Forbidden', 403, 'EASYORDERS_PILOT_REQUIRED')
      )

      fireEvent.click(screen.getByRole('button', { name: 'ربط EasyOrders' }))

      const alert = await screen.findByRole('alert')
      expect(alert.textContent).toContain(
        'لم تتم الموافقة على حسابك للربط مع EasyOrders بعد.'
      )
      expect(openedTab.close).toHaveBeenCalled()
      expect(openedTab.location.replace).not.toHaveBeenCalled()
    })

    it('keeps a viewer read-only', async () => {
      await renderPage(status({ canManage: false }))

      expect(
        screen.getByRole('button', { name: 'ربط EasyOrders' })
      ).toHaveProperty('disabled', true)
      expect(screen.getByRole('status').textContent).toContain(
        'صلاحيتك للعرض فقط'
      )
    })
  })

  describe('waiting and denied', () => {
    it('polls while the request is open and shows success when the callback lands', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      await renderPage(
        status({ state: 'pending', expiresAt: '2026-10-03T10:15:00.000Z' })
      )
      expect(fetchStatus).toHaveBeenCalledTimes(1)
      fetchStatus.mockResolvedValue(connected())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000)
      })

      // Connected: straight on to the store's details.
      await screen.findByRole('heading', {
        level: 1,
        name: 'بيانات قليلة عن طلبات متجرك على EasyOrders',
      })
      expect(fetchStatus).toHaveBeenCalledTimes(2)
    })

    it.each([
      ['ar', 'لم أوافق', 'لم يتم ربط EasyOrders', 'حاول مرة أخرى'],
      ['en', 'I didn’t accept', 'EasyOrders wasn’t connected', 'Try again'],
    ] as const)(
      'shows the not-connected state in %s when the merchant says they did not accept',
      async (locale, cancel, title, retry) => {
        await renderPage(
          status({ state: 'pending', expiresAt: '2026-10-03T10:15:00.000Z' }),
          locale
        )

        fireEvent.click(screen.getByRole('button', { name: cancel }))

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
          title
        )
        expect(screen.getByRole('button', { name: retry })).toBeTruthy()
        expect(document.body.textContent).toContain('Public API')
      }
    )

    it('shows the not-connected state for an expired request', async () => {
      await renderPage(status({ state: 'expired' }))

      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
        'لم يتم ربط EasyOrders'
      )
    })
  })

  describe('error', () => {
    it.each([
      [
        'ar',
        'EASYORDERS_KEY_REJECTED',
        'تعذّر ربط EasyOrders',
        'لم يقبل EasyOrders مفتاح الـ API الذي أنشأه لأكيد. لم يُربط أي شيء.',
      ],
      [
        'en',
        'EASYORDERS_STORE_UNAVAILABLE',
        'We couldn’t connect EasyOrders',
        'This EasyOrders store is already connected to another Akeed account.',
      ],
      [
        'en',
        'SOMETHING_NEW',
        'We couldn’t connect EasyOrders',
        'Something went wrong. Nothing was connected.',
      ],
    ] as const)(
      'explains %s %s and offers a retry',
      async (locale, code, title, message) => {
        await renderPage(
          status({ state: 'failed', lastErrorCode: code }),
          locale
        )

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
          title
        )
        expect(screen.getByRole('alert').textContent).toBe(message)
      }
    )
  })

  describe('gates', () => {
    it.each([
      ['pilot_required', 'نجهّز لك الربط مع EasyOrders'],
      ['unavailable', 'الربط مع EasyOrders غير متاح بعد'],
      ['source_exists', 'هذا الحساب لديه مصدر طلبات بالفعل'],
    ] as const)(
      'explains %s without a connect button',
      async (state, title) => {
        await renderPage(status({ state }))

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
          title
        )
        expect(
          screen.queryByRole('button', { name: 'ربط EasyOrders' })
        ).toBeNull()
      }
    )

    it('offers a retry when the status cannot be loaded', async () => {
      fetchStatus.mockRejectedValue(new Error('network'))
      mountPage()

      await screen.findByRole('heading', {
        level: 1,
        name: 'تعذّر تحميل حالة الربط مع EasyOrders',
      })
      fetchStatus.mockResolvedValue(status())
      fireEvent.click(screen.getByRole('button', { name: 'حاول مرة أخرى' }))

      await screen.findByRole('heading', {
        level: 1,
        name: 'اربط متجر نور مع EasyOrders',
      })
    })
  })

  describe('store details', () => {
    const saveAndContinue = (locale: 'ar' | 'en' = 'ar') =>
      fireEvent.click(
        screen.getByRole('button', {
          name: locale === 'ar' ? 'حفظ ومتابعة' : 'Save and continue',
        })
      )

    it.each([
      ['ar', 'بيانات قليلة عن طلبات متجرك على EasyOrders'],
      ['en', 'A few details about your EasyOrders orders'],
    ] as const)(
      'asks for the details on a step of their own, naming the store and its EasyOrders id, in %s',
      async (locale, title) => {
        await renderPage(connected(), locale)

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
          title
        )
        // One form, one button; the number comes on the next step.
        expect(document.querySelectorAll('form')).toHaveLength(1)
        expect(
          screen.queryByRole('button', { name: /send a test message|رسالة/i })
        ).toBeNull()
        expect(screen.getByText('متجر نور')).toBeTruthy()
        expect(screen.getByText('store-7f3a')).toBeTruthy()
        // No webhook address to look up and no secret to paste.
        expect(document.body.textContent).not.toContain('aB3_xZ')
        expect(document.querySelector('input[type="password"]')).toBeNull()
      }
    )

    it('warns when EasyOrders reports the store as inactive', async () => {
      await renderPage(connected({ health: 'store_inactive' }))

      expect(document.body.textContent).toContain(
        'متجرك على EasyOrders غير نشط.'
      )
    })

    it.each([
      [
        'en',
        'Nothing to copy from EasyOrders',
        'Akeed secures your webhooks by itself.',
      ],
      ['ar', 'لا شيء تنسخه من EasyOrders', 'يؤمّن أكيد الويب هوك تلقائيًا.'],
    ] as const)(
      'says Akeed secures the webhooks itself, in %s',
      async (locale, title, sentence) => {
        await renderPage(connected(), locale)

        expect(screen.getByRole('heading', { name: title })).toBeTruthy()
        expect(document.body.textContent).toContain(sentence)
      }
    )

    it.each([
      [
        'en',
        1,
        '1 order from EasyOrders was refused because its webhook secret didn’t match.',
      ],
      [
        'en',
        4,
        '4 orders from EasyOrders were refused because their webhook secret didn’t match.',
      ],
      [
        'ar',
        2,
        'رُفض طلبان من EasyOrders لأن المفتاح السري للويب هوك غير مطابق.',
      ],
    ] as const)(
      'makes refused deliveries visible in %s (%i)',
      async (locale, rejectedDeliveries, sentence) => {
        await renderPage(connected({ rejectedDeliveries }), locale)

        expect(document.body.textContent).toContain(sentence)
      }
    )

    it('says nothing about refused deliveries when there are none', async () => {
      await renderPage(connected(), 'en')

      expect(document.body.textContent).not.toContain('refused because')
    })

    describe('order settings', () => {
      const country = () =>
        document.getElementById('easyorders-phone-country') as HTMLSelectElement
      const currency = () =>
        document.getElementById('easyorders-currency') as HTMLSelectElement
      const form = () => country().closest('form') as HTMLFormElement

      it('warns that orders wait for the country and the currency', async () => {
        await renderPage(connected(), 'en')

        expect(form().textContent).toContain(
          'Orders are not confirmed until you choose both.'
        )
        expect(country().value).toBe('')
        expect(currency().value).toBe('')
      })

      it('suggests the country’s own currency, saves with one button and moves on to the number', async () => {
        onboarding.fetchOnboardingState.mockResolvedValue({
          state: readySetup(),
        })
        await renderPage(connected(), 'en')
        saveSettings.mockResolvedValue(connected(ready))

        fireEvent.change(country(), { target: { value: 'EG' } })
        expect(currency().value).toBe('EGP')
        saveAndContinue('en')

        await waitFor(() =>
          expect(saveSettings).toHaveBeenCalledWith({
            currency: 'EGP',
            phoneCountry: 'EG',
          })
        )
        expect(
          await screen.findByRole('heading', {
            level: 1,
            name: 'Get your confirmation message ready',
          })
        ).toBeTruthy()
        expect(document.getElementById('easyorders-phone-country')).toBeNull()
        // The secrets are never sent from this screen.
        expect(saveSecrets).not.toHaveBeenCalled()
      })

      it('keeps a currency the merchant already chose when the country changes', async () => {
        await renderPage(connected(), 'en')

        fireEvent.change(currency(), { target: { value: 'USD' } })
        fireEvent.change(country(), { target: { value: 'SA' } })

        expect(currency().value).toBe('USD')
      })

      it('shows what is stored, in Arabic', async () => {
        await renderPage(connected({ currency: 'SAR' }))

        expect(country().value).toBe('')
        expect(currency().value).toBe('SAR')
        expect(form().textContent).toContain('حدّد دولة متجرك وعملته')
      })

      it('asks for both before sending anything', async () => {
        await renderPage(connected(), 'en')

        fireEvent.submit(form())

        expect(
          await screen.findByText('Choose a country and a currency.')
        ).toBeTruthy()
        expect(saveSettings).not.toHaveBeenCalled()
        expect(document.activeElement).toBe(country())
      })

      it('reports a failed save and stays on the step', async () => {
        await renderPage(connected(), 'en')
        saveSettings.mockRejectedValue(
          new ApiError('invalid', 400, 'EASYORDERS_ORDER_SETTINGS_INVALID')
        )

        fireEvent.change(country(), { target: { value: 'EG' } })
        saveAndContinue('en')

        expect(
          await screen.findByText('We couldn’t save your choices. Try again.')
        ).toBeTruthy()
        // Still on the step, with what was chosen.
        expect(country().value).toBe('EG')
      })

      it.each([
        [
          'an answer without a code',
          new ApiError('Internal server error', 500),
          'UNAVAILABLE (HTTP 500)',
        ],
        [
          'no answer at all',
          new TypeError('Failed to fetch'),
          'UNAVAILABLE (TypeError: Failed to fetch)',
        ],
      ])('logs why a save failed: %s', async (_case, failure, logged) => {
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined)
        try {
          await renderPage(connected(), 'en')
          saveSettings.mockRejectedValue(failure)

          fireEvent.change(country(), { target: { value: 'EG' } })
          saveAndContinue('en')

          expect(
            await screen.findByText('We couldn’t save your choices. Try again.')
          ).toBeTruthy()
          expect(consoleError).toHaveBeenCalledWith(
            `[Onboarding] Failed to save the EasyOrders order settings: ${logged}`,
            expect.anything()
          )
        } finally {
          consoleError.mockRestore()
        }
      })

      it('is read-only for a viewer', async () => {
        await renderPage({ ...connected(), canManage: false }, 'en')

        expect(country().disabled).toBe(true)
        expect(currency().disabled).toBe(true)
      })
    })
  })
})

describe('EasyOrdersConnectPage setup, revoked and disconnected', () => {
  let openedTab: {
    opener: unknown
    location: { replace: ReturnType<typeof vi.fn> }
    close: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    openedTab = {
      opener: window,
      location: { replace: vi.fn() },
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(openedTab as unknown as Window)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    onboarding.fetchOnboardingState.mockResolvedValue({
      state: onboardingState(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** The "Your number" step, once the setup it reads has loaded. */
  const checklist = async () =>
    (
      await screen.findByRole('heading', {
        level: 2,
        name: /How confirmations will run|كيف ستعمل رسائل التأكيد/,
      })
    ).closest('form') as HTMLElement
  const sendTest = (section: HTMLElement) =>
    within(section).getByRole('button', {
      name: /send a test message|أرسل رسالة تجريبية|رسالة/i,
    }) as HTMLButtonElement

  describe('your number', () => {
    it.each([
      ['nothing', {}],
      ['only the currency', { currency: 'EGP' }],
      ['only the country', { phoneCountry: 'EG' }],
      // Learned secrets do not stand in for the country and currency.
      ['only the secrets', withSecrets],
    ] as const)(
      'is not reached while %s of the details is saved',
      async (_, saved) => {
        await renderPage(connected(saved), 'en')

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
          'A few details about your EasyOrders orders'
        )
        expect(screen.queryByLabelText('Your WhatsApp number')).toBeNull()
      }
    )

    it('asks only for the number once the details are saved, and offers the way back to them', async () => {
      onboarding.fetchOnboardingState.mockResolvedValue({
        state: readySetup(),
      })
      const { container } = await renderPage(
        connected({ ...ready, ...withSecrets }),
        'en'
      )
      const section = await checklist()

      expect(
        within(section).getByRole('heading', {
          level: 1,
          name: 'Get your confirmation message ready',
        })
      ).toBeTruthy()
      expect(
        within(section).getByLabelText('Your WhatsApp number')
      ).toBeTruthy()
      expect(section.textContent).toContain(
        'The test is free and goes to your number only.'
      )
      expect(
        within(section).getByRole('button', {
          name: 'Change the country or currency',
        })
      ).toBeTruthy()
      expect(container.querySelector('input[type="password"]')).toBeNull()
      expect(document.getElementById('easyorders-phone-country')).toBeNull()
    })

    it('shows the automation that will run and the Akeed sender, in Arabic', async () => {
      onboarding.fetchOnboardingState.mockResolvedValue({
        state: readySetup(),
      })
      await renderPage(connected({ ...ready, ...withSecrets }))
      const section = await checklist()

      expect(document.documentElement.dir).toBe('rtl')
      expect(section.textContent).toContain(
        'تُرسل رسالة تأكيد لكل طلب دفع عند الاستلام جديد.'
      )
      expect(section.textContent).toContain('تذكير بعد 120 دقيقة من دون رد.')
      expect(section.textContent).toContain(
        'تُرسل الرسائل من رقم واتساب الخاص بأكيد. لا تحتاج إلى رقم خاص بك.'
      )
      expect(section.textContent).not.toContain('عالج ما هو مذكور أعلاه')
      expect(sendTest(section).disabled).toBe(false)
    })

    it.each([
      [
        'not_configured',
        'Akeed’s WhatsApp sender isn’t ready on our side.',
        true,
      ],
      ['unknown', 'We couldn’t check it just now', false],
    ] as const)(
      'says what it knows about the sender when it is %s',
      async (sender, sentence, held) => {
        onboarding.fetchOnboardingState.mockResolvedValue({
          state: readySetup(sender),
        })
        await renderPage(connected({ ...ready, ...withSecrets }), 'en')
        const section = await checklist()

        expect(section.textContent).toContain(sentence)
        expect(sendTest(section).disabled).toBe(held)
      }
    )

    it('re-reads what blocks the finish after a setup input is saved', async () => {
      await renderPage(connected(withSecrets), 'en')
      await waitFor(() =>
        expect(onboarding.fetchOnboardingState).toHaveBeenCalledTimes(1)
      )
      saveSettings.mockResolvedValue(connected({ ...ready, ...withSecrets }))

      const country = screen.getByLabelText(
        'Customer phone country'
      ) as HTMLSelectElement
      fireEvent.change(country, { target: { value: 'EG' } })
      fireEvent.submit(country.closest('form') as HTMLFormElement)

      await waitFor(() =>
        expect(onboarding.fetchOnboardingState).toHaveBeenCalledTimes(2)
      )
    })

    it('asks for a valid number before saving or sending anything', async () => {
      onboarding.fetchOnboardingState.mockResolvedValue({
        state: readySetup(),
      })
      await renderPage(connected({ ...ready, ...withSecrets }), 'en')
      const section = await checklist()

      fireEvent.click(sendTest(section))

      expect(
        await within(section).findByText(/The number is incomplete/)
      ).toBeTruthy()
      expect(onboarding.updateOnboardingSettings).not.toHaveBeenCalled()
      expect(onboarding.sendOnboardingTest).not.toHaveBeenCalled()
    })

    it('keeps the step read-only for a viewer', async () => {
      onboarding.fetchOnboardingState.mockResolvedValue({
        state: {
          ...readySetup(),
          permissions: {
            canUpdateConfiguration: false,
            canCompleteOnboarding: false,
          },
        },
      })
      await renderPage(
        { ...connected({ ...ready, ...withSecrets }), canManage: false },
        'en'
      )

      expect(sendTest(await checklist()).disabled).toBe(true)
    })

    it('offers a retry when the setup cannot be loaded', async () => {
      onboarding.fetchOnboardingState
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue({ state: readySetup() })
      await renderPage(connected({ ...ready, ...withSecrets }), 'en')

      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

      await checklist()
      expect(onboarding.fetchOnboardingState).toHaveBeenCalledTimes(2)
    })
  })

  describe('revoked', () => {
    it.each([
      [
        'en',
        'EasyOrders no longer accepts Akeed’s access',
        'To fix it, disconnect EasyOrders here, then connect the same store again.',
        'not a live check',
      ],
      [
        'ar',
        'لم يعد EasyOrders يقبل وصول أكيد',
        'لإصلاح ذلك افصل EasyOrders من هنا ثم اربط المتجر نفسه من جديد.',
        'ليس فحصًا مباشرًا',
      ],
    ] as const)(
      'replaces setup with what happened and the way back, in %s',
      async (locale, title, recovery, caveat) => {
        await renderPage(
          connected({
            ...ready,
            ...withSecrets,
            health: 'credentials_rejected',
          }),
          locale
        )

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
          title
        )
        expect(document.body.textContent).toContain(recovery)
        expect(document.body.textContent).toContain(caveat)
        // No setup while the key is rejected, and no promise of a quick fix.
        expect(onboarding.fetchOnboardingState).not.toHaveBeenCalled()
        expect(document.body.textContent).not.toMatch(/instantly|فورًا تعود/)
      }
    )

    it('disconnects only after the merchant confirms, and says what is kept', async () => {
      await renderPage(
        connected({ ...ready, ...withSecrets, health: 'credentials_rejected' }),
        'en'
      )
      disconnect.mockResolvedValue(disconnected())

      fireEvent.click(
        screen.getByRole('button', { name: 'Disconnect EasyOrders' })
      )
      const dialog = await screen.findByRole('dialog')
      expect(dialog.textContent).toContain(
        'Your orders, confirmation results and usage history are kept.'
      )
      expect(dialog.textContent).toContain(
        'Akeed asks EasyOrders to delete the webhooks it created. The API key named Akeed stays in EasyOrders until you delete it there.'
      )
      expect(disconnect).not.toHaveBeenCalled()

      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Disconnect' })
      )

      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'متجر نور is disconnected from EasyOrders',
        })
      ).toBeTruthy()
      expect(disconnect).toHaveBeenCalledTimes(1)
    })

    it('keeps the connection when the merchant backs out', async () => {
      await renderPage(
        connected({ ...ready, ...withSecrets, health: 'credentials_rejected' }),
        'en'
      )

      fireEvent.click(
        screen.getByRole('button', { name: 'Disconnect EasyOrders' })
      )
      const dialog = await screen.findByRole('dialog')
      fireEvent.click(
        within(dialog).getAllByRole('button', { name: 'Keep connected' })[0]
      )

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(disconnect).not.toHaveBeenCalled()
    })

    it('reports a failed disconnect inside the dialog and stays connected', async () => {
      await renderPage(
        connected({ ...ready, ...withSecrets, health: 'credentials_rejected' }),
        'en'
      )
      disconnect.mockRejectedValue(
        new ApiError('forbidden', 403, 'EASYORDERS_ROLE_REQUIRED')
      )

      fireEvent.click(
        screen.getByRole('button', { name: 'Disconnect EasyOrders' })
      )
      const dialog = await screen.findByRole('dialog')
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Disconnect' })
      )

      expect(
        await within(dialog).findByText(
          'Only an owner or admin can connect EasyOrders.'
        )
      ).toBeTruthy()
      // The open dialog hides the page from the accessibility tree.
      expect(document.querySelector('h1')?.textContent).toBe(
        'EasyOrders no longer accepts Akeed’s access'
      )
    })

    it('does not let a viewer disconnect', async () => {
      await renderPage(
        {
          ...connected({ health: 'credentials_rejected' }),
          canManage: false,
        },
        'en'
      )

      expect(
        (
          screen.getByRole('button', {
            name: 'Disconnect EasyOrders',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(true)
    })
  })

  describe('disconnected', () => {
    it.each([
      [
        'en',
        'متجر نور is disconnected from EasyOrders',
        'Your earlier orders and their confirmation results are kept',
        'Delete the API key named Akeed.',
        'info@easy-orders.net',
        'Reconnect EasyOrders',
      ],
      [
        'ar',
        'تم فصل متجر نور عن EasyOrders',
        'طلباتك السابقة ونتائج تأكيدها محفوظة',
        'احذف مفتاح API المسمّى Akeed.',
        'info@easy-orders.net',
        'إعادة ربط EasyOrders',
      ],
    ] as const)(
      'says what stopped, what is kept and what to remove at EasyOrders, in %s',
      async (locale, title, kept, removal, support, reconnect) => {
        await renderPage(disconnected(), locale)

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
          title
        )
        expect(document.body.textContent).toContain(kept)
        expect(document.body.textContent).toContain(removal)
        expect(document.body.textContent).toContain(support)
        expect(screen.getByText('store-7f3a')).toBeTruthy()
        expect(screen.getByRole('button', { name: reconnect })).toBeTruthy()
        // No webhook address, secret form or setup for a disconnected store.
        expect(document.body.textContent).not.toContain('aB3_xZ')
        expect(document.querySelector('input[type="password"]')).toBeNull()
        expect(onboarding.fetchOnboardingState).not.toHaveBeenCalled()
      }
    )

    it('reconnects through EasyOrders and says it must be the same store', async () => {
      await renderPage(disconnected(), 'en')
      startInstall.mockResolvedValue({
        installUrl: INSTALL_URL,
        expiresAt: '2026-10-03T12:15:00.000Z',
      })
      fetchStatus.mockResolvedValue(
        disconnected({
          state: 'pending',
          expiresAt: '2026-10-03T12:15:00.000Z',
        })
      )

      fireEvent.click(
        screen.getByRole('button', { name: 'Reconnect EasyOrders' })
      )

      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Finish in EasyOrders',
        })
      ).toBeTruthy()
      expect(openedTab.location.replace).toHaveBeenCalledWith(INSTALL_URL)
      expect(document.body.textContent).toContain(
        'Sign in to the same EasyOrders store as before; a different store is refused.'
      )
      expect(document.body.textContent).not.toContain('CALLBACK-TOKEN-VALUE')
    })

    it.each([
      [
        'en',
        'That is a different EasyOrders store. Only the store that was connected before can be reconnected. Nothing was changed.',
      ],
      [
        'ar',
        'هذا متجر EasyOrders مختلف. لا يمكن إعادة ربط إلا المتجر الذي كان مربوطًا من قبل. لم يتغيّر شيء.',
      ],
    ] as const)(
      'explains a reconnect refused for another store, in %s',
      async (locale, message) => {
        await renderPage(
          disconnected({
            state: 'failed',
            lastErrorCode: 'EASYORDERS_RECONNECT_STORE_MISMATCH',
          }),
          locale
        )

        expect(screen.getByRole('alert').textContent).toBe(message)
      }
    )

    it('keeps a viewer read-only', async () => {
      await renderPage({ ...disconnected(), canManage: false }, 'en')

      expect(
        (
          screen.getByRole('button', {
            name: 'Reconnect EasyOrders',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(true)
    })
  })
})

describe('buildEasyOrdersChecklist', () => {
  const base = {
    currency: 'EGP',
    phoneCountry: 'EG',
    ordersSecretSet: true,
    statusSecretSet: true,
  }
  const todo = (
    connection: Parameters<typeof buildEasyOrdersChecklist>[0],
    sender: Parameters<typeof buildEasyOrdersChecklist>[1] = 'configured'
  ) =>
    buildEasyOrdersChecklist(connection, sender)
      .filter((item) => !item.done)
      .map((item) => item.id)

  it.each([
    [base, 'configured', []],
    [{ ...base, currency: null }, 'configured', ['orderDefaults']],
    [{ ...base, phoneCountry: null }, 'configured', ['orderDefaults']],
    // A secret Akeed has not learned yet holds nothing back.
    [{ ...base, statusSecretSet: false }, 'configured', []],
    [{ ...base, ordersSecretSet: false }, 'unknown', []],
    [base, 'not_configured', ['sender']],
    // An unknown sender status does not hold the merchant back.
    [base, 'unknown', []],
  ] as const)('%#', (connection, sender, expected) => {
    expect(todo(connection, sender)).toEqual(expected)
  })
})

describe('resolveEasyOrdersConnectView', () => {
  const idle = { isLoading: false, loadFailed: false, cancelled: false }

  it.each([
    [null, { ...idle, isLoading: true }, 'loading'],
    [null, { ...idle, loadFailed: true }, 'loadError'],
    [status(), idle, 'connect'],
    [status(), { ...idle, cancelled: true }, 'denied'],
    [status({ state: 'pending' }), idle, 'waiting'],
    [status({ state: 'pending' }), { ...idle, cancelled: true }, 'denied'],
    [status({ state: 'expired' }), idle, 'denied'],
    [status({ state: 'failed' }), idle, 'error'],
    // A connection wins over a stale "I didn't accept".
    [connected(), { ...idle, cancelled: true }, 'success'],
    [connected({ health: 'credentials_rejected' }), idle, 'revoked'],
    [connected({ health: 'store_inactive' }), idle, 'success'],
    [disconnected(), idle, 'disconnected'],
    // A reconnect under way shows as any other install does.
    [disconnected({ state: 'pending' }), idle, 'waiting'],
    [disconnected({ state: 'failed' }), idle, 'error'],
    [disconnected({ state: 'expired' }), idle, 'denied'],
    [status({ state: 'pilot_required' }), idle, 'pilotRequired'],
    [status({ state: 'unavailable' }), idle, 'unavailable'],
    [status({ state: 'source_exists' }), idle, 'sourceExists'],
  ] as const)('%#', (current, options, view) => {
    expect(resolveEasyOrdersConnectView(current, options)).toBe(view)
  })
})
