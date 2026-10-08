import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as onboardingApi from '@/features/onboarding/api/onboardingApi'
import type { IntegrationOnboardingState } from '@/features/onboarding/domain/onboarding.types'
import { renderOnboardingStandalone } from '@/features/onboarding/ui/standalone/components/onboardingTestUtils'
import { ApiError } from '@/shared/lib/http'
import {
  disconnectWooCommerce,
  enableWooCommerceWebhooks,
  fetchWooCommerceConnection,
  startWooCommerceInstall,
} from './wooCommerceApi'
import { WooCommerceConnectPage } from './WooCommerceConnectPage'
import { openStoreAuthorization } from './wooCommerceNavigation'
import type {
  WooCommerceConnectionDetails,
  WooCommerceConnectionStatus,
} from './wooCommerce.types'

vi.mock('./wooCommerceApi', () => ({
  checkWooCommerceConnection: vi.fn(),
  disconnectWooCommerce: vi.fn(),
  enableWooCommerceWebhooks: vi.fn(),
  fetchWooCommerceConnection: vi.fn(),
  startWooCommerceInstall: vi.fn(),
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
vi.mock('./wooCommerceNavigation', () => ({
  openStoreAuthorization: vi.fn(),
}))

const onboarding = vi.mocked(onboardingApi)
const disconnect = vi.mocked(disconnectWooCommerce)
const enable = vi.mocked(enableWooCommerceWebhooks)
const fetchStatus = vi.mocked(fetchWooCommerceConnection)
const startInstall = vi.mocked(startWooCommerceInstall)
const assign = vi.mocked(openStoreAuthorization)

const STORE = 'https://shop.example.com/eg'
/** How the connection line names it: no scheme. */
const STORE_SHOWN = 'shop.example.com/eg'
const CALLBACK_TOKEN = 'CALLBACK-TOKEN-VALUE-NEVER-SHOWN'
const AUTHORIZE_URL = `${STORE}/wc-auth/v1/authorize?app_name=Akeed&scope=read_write&user_id=482910573629104&callback_url=https%3A%2F%2Fapi.akeed.test%2Fapi%2Fwoocommerce%2Finstall%2Fcallback%2F${CALLBACK_TOKEN}`

function status(
  overrides: Partial<WooCommerceConnectionStatus> = {}
): WooCommerceConnectionStatus {
  return {
    state: 'ready',
    canManage: true,
    organizationName: 'متجر نور',
    storeUrl: null,
    expiresAt: null,
    lastErrorCode: null,
    connection: null,
    ...overrides,
  }
}

const connectedWith = (
  connection: Partial<WooCommerceConnectionDetails> = {},
  overrides: Partial<WooCommerceConnectionStatus> = {}
) =>
  status({
    state: 'connected',
    storeUrl: STORE,
    connection: {
      storeUrl: STORE,
      health: 'ok',
      connectedAt: '2026-10-04T10:00:00.000Z',
      rejectedDeliveries: 0,
      webhooks: [
        { kind: 'order_created', state: 'active' },
        { kind: 'order_updated', state: 'active' },
      ],
      webhooksCheckedAt: '2026-10-04T10:00:00.000Z',
      disconnectedAt: null,
      ...connection,
    },
    ...overrides,
  })

const connected = connectedWith()

/** What a disconnect leaves: the store address and nothing to read. */
const disconnected = (overrides: Partial<WooCommerceConnectionStatus> = {}) =>
  connectedWith(
    { webhooks: [], disconnectedAt: '2026-10-05T09:00:00.000Z' },
    { state: 'disconnected', ...overrides }
  )

function onboardingState(
  overrides: Partial<IntegrationOnboardingState> = {}
): IntegrationOnboardingState {
  return {
    integrationId: 'source-1',
    source: { platformType: 'woocommerce', identity: 'woocommerce:org' },
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
    // Neither a currency nor a phone country: WooCommerce orders carry both.
    sourceSetup: {
      connectionState: 'connected',
      disconnectedAt: null,
      store: { reference: STORE, verified: true },
      orderDefaults: { currency: null, phoneCountry: null },
      sender: { sender: 'akeed_shared', status: 'configured' },
      canComplete: true,
      blockedReasons: [],
    },
    ...overrides,
  }
}

function mountPage(locale: 'ar' | 'en' = 'ar') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return renderOnboardingStandalone(
    <QueryClientProvider client={queryClient}>
      <WooCommerceConnectPage />
    </QueryClientProvider>,
    locale
  )
}

async function renderPage(
  initial: WooCommerceConnectionStatus,
  locale: 'ar' | 'en' = 'ar'
) {
  fetchStatus.mockResolvedValue(initial)
  const view = mountPage(locale)
  await screen.findByRole('heading', { level: 1 })
  return view
}

const button = (name: string | RegExp) =>
  screen.getByRole('button', { name }) as HTMLButtonElement

describe('WooCommerceConnectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    window.history.replaceState(null, '', '/ar/onboarding')
    onboarding.fetchOnboardingState.mockResolvedValue({
      state: onboardingState(),
    })
  })

  afterEach(() => vi.restoreAllMocks())

  it.each(['ar', 'en'] as const)(
    'asks for the store address in %s',
    async (locale) => {
      await renderPage(status(), locale)

      expect(
        screen.getByRole('heading', {
          level: 1,
          name:
            locale === 'ar'
              ? 'اربط متجرك على WooCommerce'
              : 'Connect your WooCommerce store',
        })
      ).toBeTruthy()
      const field = screen.getByLabelText(
        locale === 'ar' ? 'عنوان متجرك' : 'Your store’s address'
      )
      expect(field.getAttribute('dir')).toBe('ltr')
      expect(field.getAttribute('type')).toBe('url')
    }
  )

  it('checks the store, then sends the merchant there in this tab, without putting the link on the page', async () => {
    startInstall.mockResolvedValue({
      authorizeUrl: AUTHORIZE_URL,
      storeUrl: STORE,
      expiresAt: '2026-10-04T10:15:00.000Z',
    })
    const { container } = await renderPage(status(), 'en')

    fireEvent.change(screen.getByLabelText('Your store’s address'), {
      target: { value: ` ${STORE} ` },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /Continue to my store/ })
    )

    await waitFor(() => expect(assign).toHaveBeenCalledWith(AUTHORIZE_URL))
    expect(startInstall).toHaveBeenCalledWith(STORE, 'en')
    expect(container.innerHTML).not.toContain(CALLBACK_TOKEN)
    expect(container.innerHTML).not.toContain('wc-auth')
  })

  it('names the store on the connection line as the merchant types it', async () => {
    await renderPage(status(), 'en')
    expect(
      screen.getByText('Akeed and Your store are not connected yet.')
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Your store’s address'), {
      target: { value: 'shop.example.com/eg/' },
    })

    expect(
      screen.getByText(STORE_SHOWN).closest('bdi')?.getAttribute('dir')
    ).toBe('ltr')
    expect(
      screen.getByText('Akeed and shop.example.com/eg are not connected yet.')
    ).toBeTruthy()
  })

  it('takes a bare domain to mean https', async () => {
    startInstall.mockRejectedValue(new ApiError('refused', 422, 'X'))
    await renderPage(status(), 'en')

    fireEvent.change(screen.getByLabelText('Your store’s address'), {
      target: { value: 'shop.example.com/eg' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /Continue to my store/ })
    )

    await waitFor(() => expect(startInstall).toHaveBeenCalledWith(STORE, 'en'))
  })

  it('asks for an address before calling anything', async () => {
    await renderPage(status(), 'en')

    fireEvent.click(
      screen.getByRole('button', { name: /Continue to my store/ })
    )

    expect(await screen.findByText('Enter your store’s address.')).toBeTruthy()
    expect(startInstall).not.toHaveBeenCalled()
  })

  it.each([
    [
      'WOOCOMMERCE_STORE_HTTPS_REQUIRED',
      'Your store’s address must start with https://. Akeed does not connect to stores without HTTPS.',
    ],
    [
      'WOOCOMMERCE_REST_NOT_FOUND',
      'Akeed could not find the WooCommerce REST API at this address. In WordPress, open Settings > Permalinks, choose any option other than Plain, and make sure WooCommerce is up to date.',
    ],
    [
      'WOOCOMMERCE_STORE_ADDRESS_NOT_PUBLIC',
      'Akeed could not reach this address on the public internet. Check the address and try again.',
    ],
    ['SOMETHING_NEW', 'Something went wrong. Nothing was connected.'],
  ])(
    'explains a store refused at the start (%s) and keeps what was typed',
    async (code, message) => {
      startInstall.mockRejectedValue(new ApiError('refused', 422, code))
      await renderPage(status(), 'en')
      const field = screen.getByLabelText('Your store’s address')

      fireEvent.change(field, { target: { value: 'http://shop.example.com' } })
      fireEvent.click(
        screen.getByRole('button', { name: /Continue to my store/ })
      )

      expect(await screen.findByText(message)).toBeTruthy()
      expect((field as HTMLInputElement).value).toBe('http://shop.example.com')
      expect(field.getAttribute('aria-invalid')).toBe('true')
      expect(assign).not.toHaveBeenCalled()
    }
  )

  it('waits for the store after the merchant approved, names the store, and polls', async () => {
    window.history.replaceState(
      null,
      '',
      '/ar/onboarding?success=1&user_id=482910573629104'
    )
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      fetchStatus
        .mockResolvedValueOnce(
          status({
            state: 'pending',
            storeUrl: STORE,
            expiresAt: '2026-10-04T10:15:00.000Z',
          })
        )
        .mockResolvedValue(connected)
      mountPage('en')

      expect(
        await screen.findByRole('heading', { name: 'Finishing the connection' })
      ).toBeTruthy()
      expect(
        screen.getByText(STORE_SHOWN).closest('bdi')?.getAttribute('dir')
      ).toBe('ltr')
      // The hint is read once and taken out of the address.
      expect(window.location.search).toBe('')

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000)
      })
      // Connected: straight on to the number for the test message.
      expect(
        await screen.findByRole('heading', {
          name: 'Get your confirmation message ready',
        })
      ).toBeTruthy()
      expect(await screen.findByLabelText('Your WhatsApp number')).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows the denied state on success=0, with where to remove a key, and changes nothing', async () => {
    window.history.replaceState(null, '', '/en/onboarding?success=0')
    await renderPage(status({ state: 'pending', storeUrl: STORE }), 'en')

    expect(
      screen.getByRole('heading', { name: 'The connection wasn’t approved' })
    ).toBeTruthy()
    expect(
      screen.getByText(/WooCommerce > Settings > Advanced > REST API/)
    ).toBeTruthy()
    expect(startInstall).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      (screen.getByLabelText('Your store’s address') as HTMLInputElement).value
    ).toBe(STORE)
  })

  it.each(['ar', 'en'] as const)(
    'explains an unsupported store found at the callback, in %s',
    async (locale) => {
      await renderPage(
        status({
          state: 'failed',
          storeUrl: STORE,
          lastErrorCode: 'WOOCOMMERCE_CREDENTIALS_REJECTED',
        }),
        locale
      )

      expect(screen.getByRole('alert').textContent).toContain(
        locale === 'ar'
          ? 'لم يقبل متجرك مفتاح الـ API الجديد.'
          : 'Your store did not accept the new API key.'
      )
      expect(screen.getByText(STORE_SHOWN)).toBeTruthy()
    }
  )

  it('shows an expired request as an error', async () => {
    await renderPage(status({ state: 'expired', storeUrl: STORE }), 'en')

    expect(
      screen.getByRole('heading', { name: 'We couldn’t connect WooCommerce' })
    ).toBeTruthy()
    expect(
      screen.getByText(
        'The connection request expired before your store finished. Nothing was connected.'
      )
    ).toBeTruthy()
  })

  it.each(['ar', 'en'] as const)(
    'shows the connected store in %s and no credential',
    async (locale) => {
      const { container } = await renderPage(connected, locale)

      expect(screen.getByText(STORE_SHOWN)).toBeTruthy()
      expect(container.innerHTML).not.toMatch(
        /ck_|cs_|wc-auth|\/webhooks\/|callback/i
      )
    }
  )

  it('lets a viewer look but not connect', async () => {
    await renderPage(status({ canManage: false }), 'en')

    expect(
      screen.getByText(
        'You have read-only access. Ask an owner or admin to connect WooCommerce.'
      )
    ).toBeTruthy()
    expect(
      (
        screen.getByRole('button', {
          name: /Continue to my store/,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })

  it.each([
    ['unavailable', 'WooCommerce isn’t available yet'],
    ['pilot_required', 'Your account is waiting for approval'],
    ['source_exists', 'This account already has an order source'],
  ] as const)('shows %s', async (state, title) => {
    await renderPage(status({ state }), 'en')

    expect(screen.getByRole('heading', { name: title })).toBeTruthy()
  })
})

describe('WooCommerceConnectPage setup and recovery (US-07-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    window.history.replaceState(null, '', '/ar/onboarding')
    onboarding.fetchOnboardingState.mockResolvedValue({
      state: onboardingState(),
    })
  })

  afterEach(() => vi.restoreAllMocks())

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
    it('asks only for the number, names the store and says how confirmations will run', async () => {
      const { container } = await renderPage(connected, 'en')
      const section = await checklist()

      expect(
        within(section).getByRole('heading', {
          level: 1,
          name: 'Get your confirmation message ready',
        })
      ).toBeTruthy()
      expect(within(section).getByText(STORE_SHOWN)).toBeTruthy()
      expect(section.textContent).toContain(
        'The test is free and goes to your number only.'
      )
      expect(section.textContent).toContain(
        'Messages go out from Akeed’s WhatsApp number.'
      )
      expect(section.textContent).toContain(
        'Akeed never cancels the order in WooCommerce by itself.'
      )
      expect(section.textContent).not.toContain('Fix what’s flagged above')
      expect(sendTest(section).disabled).toBe(false)
      // Nothing to pick or paste for the store: the only field is the
      // number for the test message.
      expect(container.textContent).not.toMatch(
        /Country and currency|webhook secret/i
      )
      expect(container.querySelector('input[type="password"]')).toBeNull()
    })

    it('stays quiet about order notifications while they work, and leaves the connection check to Settings', async () => {
      await renderPage(connected, 'en')
      await checklist()

      expect(document.body.textContent).not.toContain(
        'Order notifications in your store'
      )
      expect(
        screen.queryByRole('button', { name: 'Check connection' })
      ).toBeNull()
    })

    it('shows the same in Arabic, right to left', async () => {
      await renderPage(connected)
      const section = await checklist()

      expect(document.documentElement.dir).toBe('rtl')
      expect(
        within(section).getByRole('heading', {
          level: 1,
          name: 'جهّز رسالة التأكيد لمتجرك',
        })
      ).toBeTruthy()
      expect(section.textContent).toContain(
        'رسالة التجربة مجانية وتصل إلى رقمك فقط.'
      )
      expect(section.textContent).toContain('تذكير بعد 120 دقيقة من دون رد.')
      expect(sendTest(section).disabled).toBe(false)
    })

    it('holds the test while the backend says something blocks setup', async () => {
      onboarding.fetchOnboardingState.mockResolvedValue({
        state: onboardingState({
          sourceSetup: {
            ...onboardingState().sourceSetup!,
            canComplete: false,
            blockedReasons: ['merchant_name_missing'],
          },
        }),
      })
      await renderPage(connected, 'en')
      const section = await checklist()

      expect(sendTest(section).disabled).toBe(true)
      expect(section.textContent).toContain(
        'Fix what’s flagged above to send the test message.'
      )
    })

    it('does not let a viewer start the test', async () => {
      onboarding.fetchOnboardingState.mockResolvedValue({
        state: onboardingState({
          permissions: {
            canUpdateConfiguration: false,
            canCompleteOnboarding: false,
          },
        }),
      })
      await renderPage(connectedWith({}, { canManage: false }), 'en')

      expect(sendTest(await checklist()).disabled).toBe(true)
    })

    it('offers a retry when the setup cannot be loaded', async () => {
      onboarding.fetchOnboardingState.mockRejectedValueOnce(
        new Error('offline')
      )
      await renderPage(connected, 'en')

      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

      expect(await checklist()).toBeTruthy()
    })
  })

  describe('a disabled order notification', () => {
    const disabledOne = connectedWith({
      webhooks: [
        { kind: 'order_created', state: 'active' },
        { kind: 'order_updated', state: 'disabled' },
      ],
    })
    const blocked = () =>
      onboardingState({
        sourceSetup: {
          ...onboardingState().sourceSetup!,
          canComplete: false,
          blockedReasons: ['webhook_disabled'],
        },
      })

    it.each([
      [
        'en',
        'Your store disabled an order notification',
        'Orders placed while it was disabled were not sent to Akeed and are not imported.',
        'Your store disabled an order notification. Re-enable it to continue.',
      ],
      [
        'ar',
        'عطّل متجرك أحد إشعارات الطلبات',
        'الطلبات التي أُنشئت أثناء تعطيله لم تُرسل إلى أكيد ولا تُستورد.',
        'عطّل متجرك أحد إشعارات الطلبات. أعد تفعيله للمتابعة.',
      ],
    ] as const)(
      'says so, says missed orders are not imported, and holds the test, in %s',
      async (locale, title, missed, blocker) => {
        onboarding.fetchOnboardingState.mockResolvedValue({ state: blocked() })
        await renderPage(disabledOne, locale)
        const section = await checklist()

        expect(document.body.textContent).toContain(title)
        expect(document.body.textContent).toContain(missed)
        expect(section.textContent).toContain(blocker)
        expect(sendTest(section).disabled).toBe(true)
      }
    )

    it('re-enables it, shows it active again and still promises no missed orders', async () => {
      onboarding.fetchOnboardingState.mockResolvedValueOnce({
        state: blocked(),
      })
      await renderPage(disabledOne, 'en')
      enable.mockResolvedValue(connected)

      fireEvent.click(button('Re-enable order notifications'))

      expect(
        await screen.findByText(
          'Order notifications are active again. Orders placed while they were disabled are not imported.'
        )
      ).toBeTruthy()
      expect(enable).toHaveBeenCalledTimes(1)
      expect(
        screen.queryByRole('button', { name: 'Re-enable order notifications' })
      ).toBeNull()
      // The checklist reads what blocks the finish again.
      await waitFor(() =>
        expect(onboarding.fetchOnboardingState).toHaveBeenCalledTimes(2)
      )
      await waitFor(async () =>
        expect(sendTest(await checklist()).disabled).toBe(false)
      )
    })

    it.each([
      [
        'WOOCOMMERCE_WEBHOOK_ENABLE_UNAVAILABLE',
        'Order notifications can’t be re-enabled right now. Contact Akeed support.',
      ],
      [
        'WOOCOMMERCE_WEBHOOK_MISSING',
        'An order notification was deleted in your store, so it can’t be re-enabled. Disconnect WooCommerce here, then connect the same store again.',
      ],
      [
        'WOOCOMMERCE_WEBHOOK_ENABLE_FAILED',
        'Your store didn’t re-enable the order notification. Try again, or contact Akeed support if it keeps happening.',
      ],
      [
        'SOMETHING_NEW',
        'We couldn’t re-enable the order notification. Nothing was changed. Try again.',
      ],
    ])('explains a refused re-enable (%s)', async (code, message) => {
      await renderPage(disabledOne, 'en')
      enable.mockRejectedValue(new ApiError('refused', 503, code))

      fireEvent.click(button('Re-enable order notifications'))

      expect(await screen.findByText(message)).toBeTruthy()
      expect(button('Re-enable order notifications').disabled).toBe(false)
    })

    it('does not let a viewer re-enable', async () => {
      await renderPage(
        connectedWith(
          { webhooks: disabledOne.connection!.webhooks },
          { canManage: false }
        ),
        'en'
      )

      expect(button('Re-enable order notifications').disabled).toBe(true)
    })
  })

  it.each([
    [
      'paused',
      'An order notification is paused in your store, so orders don’t reach Akeed.',
    ],
    [
      'missing',
      'An order notification was deleted in your store, so orders don’t reach Akeed.',
    ],
  ] as const)(
    'explains a %s notification and offers no re-enable for it',
    async (state, sentence) => {
      await renderPage(
        connectedWith({
          webhooks: [
            { kind: 'order_created', state },
            { kind: 'order_updated', state: 'active' },
          ],
        }),
        'en'
      )

      expect(document.body.textContent).toContain(sentence)
      expect(
        screen.queryByRole('button', { name: 'Re-enable order notifications' })
      ).toBeNull()
    }
  )

  it('says how many deliveries were refused', async () => {
    await renderPage(connectedWith({ rejectedDeliveries: 3 }), 'en')

    expect(document.body.textContent).toContain(
      '3 order notifications were refused because their signature or store address didn’t match.'
    )
  })

  describe('credentials rejected', () => {
    it.each([
      [
        'en',
        'credentials_rejected',
        'Your store no longer accepts Akeed’s access',
        'The last time Akeed used its API key, your store rejected it.',
        'To fix it, disconnect WooCommerce here, then connect the same store again.',
      ],
      [
        'ar',
        'credentials_rejected',
        'لم يعد متجرك يقبل وصول أكيد',
        'في آخر مرة استخدم أكيد مفتاح API رفضه متجرك.',
        'لإصلاح ذلك افصل WooCommerce من هنا ثم اربط المتجر نفسه من جديد.',
      ],
      [
        'en',
        'permission_denied',
        'Your store no longer accepts Akeed’s access',
        'its WordPress user may not manage WooCommerce',
        'To fix it, disconnect WooCommerce here, then connect the same store again.',
      ],
    ] as const)(
      'says the store refused Akeed and how to recover, in %s (%s)',
      async (locale, health, title, body, recovery) => {
        await renderPage(connectedWith({ health }), locale)

        expect(
          screen.getByRole('heading', { level: 1, name: title })
        ).toBeTruthy()
        expect(screen.getByRole('alert').textContent).toContain(body)
        expect(document.body.textContent).toContain(recovery)
        expect(screen.getByText(STORE_SHOWN)).toBeTruthy()
        // No checklist and no test while the store refuses the key.
        expect(
          screen.queryByRole('heading', { name: /Finish setting up|أكمل/ })
        ).toBeNull()
      }
    )

    it('disconnects after a confirmation, then shows what to remove and the way back', async () => {
      await renderPage(connectedWith({ health: 'credentials_rejected' }), 'en')
      disconnect.mockResolvedValue({
        ...disconnected(),
        webhookCleanup: 'failed',
      })

      fireEvent.click(button('Disconnect WooCommerce'))
      const dialog = await screen.findByRole('dialog')
      expect(dialog.textContent).toContain(
        'New orders from WooCommerce are no longer received, and messages or order updates that were waiting are not sent.'
      )
      expect(dialog.textContent).toContain(
        'The API key WooCommerce created for Akeed stays in your store until you revoke it there.'
      )
      expect(dialog.textContent).toContain(
        'Orders placed while disconnected are not imported.'
      )
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Disconnect' })
      )

      const heading = await screen.findByRole('heading', {
        level: 1,
        name: 'Your WooCommerce store is disconnected',
      })
      // Keyboard and screen-reader users land on the new state.
      await waitFor(() => expect(document.activeElement).toBe(heading))
      expect(document.body.textContent).toContain(
        'In WordPress, open WooCommerce > Settings > Advanced > REST API.'
      )
      expect(document.body.textContent).toContain(
        'Find the key named Akeed and choose Revoke.'
      )
      // The store did not confirm the deletion, and the screen says so.
      expect(screen.getByRole('status').textContent).toContain(
        'Your store didn’t confirm that Akeed’s order notifications were deleted.'
      )
      expect(button('Reconnect WooCommerce').disabled).toBe(false)
    })

    it('keeps the connection when the confirmation is dismissed', async () => {
      await renderPage(connectedWith({ health: 'credentials_rejected' }), 'en')

      fireEvent.click(button('Disconnect WooCommerce'))
      const dialog = await screen.findByRole('dialog')
      fireEvent.click(
        within(dialog).getAllByRole('button', { name: 'Keep connected' })[0]
      )

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(disconnect).not.toHaveBeenCalled()
    })

    it.each([
      [
        'WOOCOMMERCE_NOT_CONNECTED',
        'WooCommerce isn’t connected to this account.',
      ],
      [
        'UNAVAILABLE',
        'We couldn’t disconnect WooCommerce. Nothing was changed. Try again.',
      ],
    ])(
      'explains a failed disconnect (%s) and changes nothing',
      async (code, message) => {
        await renderPage(
          connectedWith({ health: 'credentials_rejected' }),
          'en'
        )
        disconnect.mockRejectedValue(new ApiError('failed', 500, code))

        fireEvent.click(button('Disconnect WooCommerce'))
        const dialog = await screen.findByRole('dialog')
        fireEvent.click(
          within(dialog).getByRole('button', { name: 'Disconnect' })
        )

        expect((await within(dialog).findByRole('alert')).textContent).toBe(
          message
        )
        // Still the same screen behind the dialog.
        expect(
          screen.getByRole('heading', {
            level: 1,
            hidden: true,
            name: 'Your store no longer accepts Akeed’s access',
          })
        ).toBeTruthy()
      }
    )

    it('does not let a viewer disconnect', async () => {
      await renderPage(
        connectedWith({ health: 'credentials_rejected' }, { canManage: false }),
        'en'
      )

      expect(button('Disconnect WooCommerce').disabled).toBe(true)
    })
  })

  describe('disconnected', () => {
    it.each([
      [
        'en',
        'Your WooCommerce store is disconnected',
        'Your earlier orders and their confirmation results are kept and still appear in your reports.',
        'Reconnect WooCommerce',
      ],
      [
        'ar',
        'متجرك على WooCommerce مفصول',
        'طلباتك السابقة ونتائج تأكيدها محفوظة وما زالت تظهر في تقاريرك.',
        'إعادة ربط WooCommerce',
      ],
    ] as const)(
      'names the store, says history is kept, and offers the same store back, in %s',
      async (locale, title, history, reconnect) => {
        const { container } = await renderPage(disconnected(), locale)

        expect(
          screen.getByRole('heading', { level: 1, name: title })
        ).toBeTruthy()
        expect(document.body.textContent).toContain(history)
        expect(
          screen.getByText(STORE_SHOWN).closest('bdi')?.getAttribute('dir')
        ).toBe('ltr')
        expect(button(reconnect).disabled).toBe(false)
        // The store is fixed: there is no address to type.
        expect(container.querySelector('input')).toBeNull()
        expect(container.innerHTML).not.toMatch(
          /ck_|cs_|wc-auth|\/webhooks\/|callback/i
        )
      }
    )

    it('reconnects the store that was connected, in this tab, without showing the link', async () => {
      const { container } = await renderPage(disconnected(), 'en')
      startInstall.mockResolvedValue({
        authorizeUrl: AUTHORIZE_URL,
        storeUrl: STORE,
        expiresAt: '2026-10-05T10:15:00.000Z',
      })

      fireEvent.click(button('Reconnect WooCommerce'))

      await waitFor(() => expect(assign).toHaveBeenCalledWith(AUTHORIZE_URL))
      expect(startInstall).toHaveBeenCalledWith(STORE, 'en')
      expect(container.innerHTML).not.toContain(CALLBACK_TOKEN)
    })

    it.each([
      [
        'WOOCOMMERCE_PILOT_REQUIRED',
        'Your account isn’t approved for WooCommerce yet.',
      ],
      [
        'WOOCOMMERCE_RECONNECT_STORE_MISMATCH',
        'Only the store that was connected before can be reconnected. Nothing was changed.',
      ],
    ])(
      'explains why a reconnect could not be started (%s)',
      async (code, message) => {
        await renderPage(disconnected(), 'en')
        startInstall.mockRejectedValue(new ApiError('refused', 403, code))

        fireEvent.click(button('Reconnect WooCommerce'))

        expect((await screen.findByRole('alert')).textContent).toBe(message)
        expect(assign).not.toHaveBeenCalled()
      }
    )

    it('explains a refused reconnect, says only the same store works, and goes back to the reconnect', async () => {
      await renderPage(
        disconnected({
          state: 'failed',
          lastErrorCode: 'WOOCOMMERCE_STORE_UNAVAILABLE',
        }),
        'en'
      )

      expect(screen.getByRole('alert').textContent).toBe(
        'This store is already connected to another Akeed account.'
      )
      expect(document.body.textContent).toContain(
        'Approve again in the same WooCommerce store as before; a different store is refused.'
      )

      fireEvent.click(button('Try again'))

      // Not the address field: a reconnect has no address to choose.
      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Your WooCommerce store is disconnected',
        })
      ).toBeTruthy()
      expect(screen.queryByLabelText('Your store’s address')).toBeNull()
    })

    it('does not let a viewer reconnect', async () => {
      await renderPage(disconnected({ canManage: false }), 'en')

      expect(button('Reconnect WooCommerce').disabled).toBe(true)
    })
  })
})
