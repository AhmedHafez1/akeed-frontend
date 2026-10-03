import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderOnboardingStandalone } from '@/features/onboarding/ui/standalone/components/onboardingTestUtils'
import { ApiError } from '@/shared/lib/http'
import {
  fetchEasyOrdersConnection,
  saveEasyOrdersWebhookSecrets,
  startEasyOrdersInstall,
} from './easyOrdersApi'
import { EasyOrdersConnectPage } from './EasyOrdersConnectPage'
import {
  resolveEasyOrdersConnectView,
  type EasyOrdersConnectionStatus,
} from './easyOrders.types'

vi.mock('./easyOrdersApi', () => ({
  fetchEasyOrdersConnection: vi.fn(),
  saveEasyOrdersWebhookSecrets: vi.fn(),
  startEasyOrdersInstall: vi.fn(),
}))

const fetchStatus = vi.mocked(fetchEasyOrdersConnection)
const saveSecrets = vi.mocked(saveEasyOrdersWebhookSecrets)
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
      connectedAt: '2026-10-03T10:00:00.000Z',
      ...connection,
    },
  })

async function renderPage(
  initial: EasyOrdersConnectionStatus,
  locale: 'ar' | 'en' = 'ar'
) {
  fetchStatus.mockResolvedValue(initial)
  const view = renderOnboardingStandalone(<EasyOrdersConnectPage />, locale)
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

      await screen.findByRole('heading', {
        level: 1,
        name: 'تم ربط متجر نور مع EasyOrders',
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
      renderOnboardingStandalone(<EasyOrdersConnectPage />)

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

  describe('success', () => {
    it.each([
      ['ar', 'تم ربط متجر نور مع EasyOrders', 'تم الربط'],
      ['en', 'متجر نور is connected to EasyOrders', 'Connected'],
    ] as const)(
      'names the connected store and its EasyOrders id in %s',
      async (locale, title, badge) => {
        await renderPage(connected(), locale)

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
          title
        )
        expect(screen.getByText(badge)).toBeTruthy()
        expect(screen.getByText('store-7f3a')).toBeTruthy()
        expect(document.body.textContent).toContain('…aB3_xZ')
      }
    )

    it('warns when EasyOrders reports the store as inactive', async () => {
      await renderPage(connected({ health: 'store_inactive' }))

      expect(document.body.textContent).toContain(
        'متجرك على EasyOrders غير نشط.'
      )
    })

    it('saves both secrets, then empties the masked fields and never shows them', async () => {
      const view = await renderPage(connected())
      saveSecrets.mockResolvedValue(
        connected({ ordersSecretSet: true, statusSecretSet: true })
      )
      const orders = document.getElementById(
        'easyorders-orders-secret'
      ) as HTMLInputElement
      const statusField = document.getElementById(
        'easyorders-status-secret'
      ) as HTMLInputElement
      expect(orders.type).toBe('password')
      expect(statusField.type).toBe('password')
      expect(orders.autocomplete).toBe('off')

      fireEvent.change(orders, { target: { value: ' ORDERS-secret-01 ' } })
      fireEvent.change(statusField, { target: { value: 'STATUS-secret-02' } })
      fireEvent.click(screen.getByRole('button', { name: 'حفظ المفتاحين' }))

      await waitFor(() =>
        expect(saveSecrets).toHaveBeenCalledWith({
          ordersSecret: 'ORDERS-secret-01',
          statusSecret: 'STATUS-secret-02',
        })
      )
      await screen.findByText(
        'تم حفظ المفتاحين. يُخزَّنان مشفّرين ولا يُعرضان مرة أخرى.'
      )
      expect(orders.value).toBe('')
      expect(statusField.value).toBe('')
      expect(view.container.innerHTML).not.toContain('ORDERS-secret-01')
      expect(view.container.innerHTML).not.toContain('STATUS-secret-02')
      expect(
        screen.getByRole('button', { name: 'استبدال المفتاحين' })
      ).toBeTruthy()
    })

    it.each([
      ['', 'STATUS-secret-02', 'الصق المفتاحين.'],
      [
        'has space',
        'STATUS-secret-02',
        'المفتاح 8 أحرف على الأقل وبدون مسافات. انسخه مرة أخرى من EasyOrders.',
      ],
    ])(
      'does not send "%s" / "%s"',
      async (ordersValue, statusValue, message) => {
        await renderPage(connected())

        fireEvent.change(document.getElementById('easyorders-orders-secret')!, {
          target: { value: ordersValue },
        })
        fireEvent.change(document.getElementById('easyorders-status-secret')!, {
          target: { value: statusValue },
        })
        fireEvent.click(screen.getByRole('button', { name: 'حفظ المفتاحين' }))

        expect((await screen.findByRole('alert')).textContent).toBe(message)
        expect(saveSecrets).not.toHaveBeenCalled()
      }
    )

    it('reports a failed save without logging the secrets', async () => {
      await renderPage(connected())
      saveSecrets.mockRejectedValue(
        new ApiError('Bad Request', 400, 'EASYORDERS_SECRETS_INVALID')
      )

      fireEvent.change(document.getElementById('easyorders-orders-secret')!, {
        target: { value: 'ORDERS-secret-01' },
      })
      fireEvent.change(document.getElementById('easyorders-status-secret')!, {
        target: { value: 'STATUS-secret-02' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'حفظ المفتاحين' }))

      expect((await screen.findByRole('alert')).textContent).toBe(
        'تعذّر حفظ المفتاحين. حاول مرة أخرى.'
      )
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
        'secret-0'
      )
    })
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
    [status({ state: 'pilot_required' }), idle, 'pilotRequired'],
    [status({ state: 'unavailable' }), idle, 'unavailable'],
    [status({ state: 'source_exists' }), idle, 'sourceExists'],
  ] as const)('%#', (current, options, view) => {
    expect(resolveEasyOrdersConnectView(current, options)).toBe(view)
  })
})
