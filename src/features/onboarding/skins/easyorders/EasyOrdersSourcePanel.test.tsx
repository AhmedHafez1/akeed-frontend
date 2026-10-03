import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderOnboardingStandalone } from '@/features/onboarding/ui/standalone/components/onboardingTestUtils'
import { ApiError } from '@/shared/lib/http'
import {
  disconnectEasyOrders,
  fetchEasyOrdersConnection,
  saveEasyOrdersWebhookSecrets,
  startEasyOrdersInstall,
} from './easyOrdersApi'
import { EasyOrdersSourcePanel } from './EasyOrdersSourcePanel'
import type { EasyOrdersConnectionStatus } from './easyOrders.types'

vi.mock('./easyOrdersApi', () => ({
  disconnectEasyOrders: vi.fn(),
  fetchEasyOrdersConnection: vi.fn(),
  saveEasyOrdersOrderSettings: vi.fn(),
  saveEasyOrdersWebhookSecrets: vi.fn(),
  startEasyOrdersInstall: vi.fn(),
}))

const disconnect = vi.mocked(disconnectEasyOrders)
const fetchStatus = vi.mocked(fetchEasyOrdersConnection)
const saveSecrets = vi.mocked(saveEasyOrdersWebhookSecrets)
const startInstall = vi.mocked(startEasyOrdersInstall)

const INSTALL_URL =
  'https://app.easy-orders.net/#/install-app?callback_url=https%3A%2F%2Fapi.akeed.test%2Fapi%2Feasyorders%2Finstall%2Fcallback%2FCALLBACK-TOKEN-VALUE'

function connected(
  connection: Partial<
    NonNullable<EasyOrdersConnectionStatus['connection']>
  > = {},
  overrides: Partial<EasyOrdersConnectionStatus> = {}
): EasyOrdersConnectionStatus {
  return {
    state: 'connected',
    canManage: true,
    organizationName: 'متجر نور',
    expiresAt: null,
    lastErrorCode: null,
    connection: {
      storeId: 'store-7f3a',
      storeVerified: true,
      health: 'ok',
      webhookUrlHint: 'aB3_xZ',
      ordersSecretSet: true,
      statusSecretSet: true,
      currency: 'EGP',
      phoneCountry: 'EG',
      rejectedDeliveries: 0,
      connectedAt: '2026-10-01T10:00:00.000Z',
      disconnectedAt: null,
      ...connection,
    },
    ...overrides,
  }
}

const disconnected = (overrides: Partial<EasyOrdersConnectionStatus> = {}) =>
  connected(
    {
      storeVerified: false,
      webhookUrlHint: null,
      ordersSecretSet: false,
      statusSecretSet: false,
      disconnectedAt: '2026-10-03T12:00:00.000Z',
    },
    { state: 'disconnected', ...overrides }
  )

async function renderPanel(
  initial: EasyOrdersConnectionStatus,
  locale: 'ar' | 'en' = 'en',
  onChanged = vi.fn()
) {
  fetchStatus.mockResolvedValue(initial)
  renderOnboardingStandalone(
    <EasyOrdersSourcePanel onChanged={onChanged} />,
    locale
  )
  await waitFor(() =>
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
  )
  return onChanged
}

const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement

describe('EasyOrdersSourcePanel', () => {
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
  })

  describe('connected', () => {
    it('shows the store and lets the secrets be replaced, never what they are', async () => {
      await renderPanel(connected())

      expect(screen.getByText('store-7f3a')).toBeTruthy()
      expect(button('Replace secrets')).toBeTruthy()
      expect(button('Disconnect EasyOrders')).toBeTruthy()
      for (const input of document.querySelectorAll('input'))
        expect((input as HTMLInputElement).value).toBe('')
    })

    it('disconnects after a confirmation, then shows the way back and what to remove', async () => {
      const onChanged = await renderPanel(connected())
      disconnect.mockResolvedValue(disconnected())

      fireEvent.click(button('Disconnect EasyOrders'))
      const dialog = await screen.findByRole('dialog')
      expect(dialog.textContent).toContain(
        'New orders from EasyOrders are no longer received, and messages or status updates that were waiting are not sent.'
      )
      expect(dialog.textContent).toContain(
        'Orders placed while disconnected are not imported.'
      )
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Disconnect' })
      )

      expect(await screen.findByText('EasyOrders is disconnected')).toBeTruthy()
      expect(document.body.textContent).toContain(
        'Under Webhooks, delete every webhook named Akeed.'
      )
      expect(document.body.textContent).toContain(
        'Until you delete them, EasyOrders keeps sending orders to an address Akeed no longer accepts.'
      )
      expect(button('Reconnect EasyOrders').disabled).toBe(false)
      expect(document.querySelector('input[type="password"]')).toBeNull()
      // Settings re-reads its state and the health card.
      expect(onChanged).toHaveBeenCalledTimes(1)
    })

    it('keeps the connection when the confirmation is dismissed', async () => {
      const onChanged = await renderPanel(connected())

      fireEvent.click(button('Disconnect EasyOrders'))
      const dialog = await screen.findByRole('dialog')
      fireEvent.click(
        within(dialog).getAllByRole('button', { name: 'Keep connected' })[0]
      )

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(disconnect).not.toHaveBeenCalled()
      expect(onChanged).not.toHaveBeenCalled()
    })

    it.each([
      ['en', 'EasyOrders isn’t connected to this account.'],
      ['ar', 'EasyOrders غير مربوط بهذا الحساب.'],
    ] as const)(
      'explains a failed disconnect and changes nothing, in %s',
      async (locale, message) => {
        const labels =
          locale === 'en'
            ? { open: 'Disconnect EasyOrders', confirm: 'Disconnect' }
            : { open: 'فصل EasyOrders', confirm: 'فصل' }
        const onChanged = await renderPanel(connected(), locale)
        disconnect.mockRejectedValue(
          new ApiError('gone', 404, 'EASYORDERS_NOT_CONNECTED')
        )

        fireEvent.click(button(labels.open))
        const dialog = await screen.findByRole('dialog')
        fireEvent.click(
          within(dialog).getByRole('button', { name: labels.confirm })
        )

        expect((await within(dialog).findByRole('alert')).textContent).toBe(
          message
        )
        expect(onChanged).not.toHaveBeenCalled()
      }
    )

    it('gives a viewer the state and no way to change it', async () => {
      await renderPanel(connected({}, { canManage: false }))

      expect(screen.getByText('store-7f3a')).toBeTruthy()
      expect(
        screen.getByText(
          'You have read-only access. An owner or admin manages the EasyOrders connection.'
        )
      ).toBeTruthy()
      expect(
        screen.queryByRole('button', { name: 'Disconnect EasyOrders' })
      ).toBeNull()
      expect(button('Replace secrets').disabled).toBe(true)
    })

    it('tells Settings when new secrets are saved', async () => {
      const onChanged = await renderPanel(
        connected({ ordersSecretSet: false, statusSecretSet: false })
      )
      saveSecrets.mockResolvedValue(connected())

      fireEvent.change(screen.getByLabelText('Orders webhook secret'), {
        target: { value: 'ORDERS-secret-01' },
      })
      fireEvent.change(screen.getByLabelText('Order status webhook secret'), {
        target: { value: 'STATUS-secret-02' },
      })
      fireEvent.click(button('Save secrets'))

      await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
      expect(document.body.textContent).not.toContain('ORDERS-secret-01')
    })
  })

  describe('revoked', () => {
    it.each([
      [
        'en',
        'EasyOrders no longer accepts Akeed’s access',
        'To fix it, disconnect EasyOrders here, then connect the same store again.',
      ],
      [
        'ar',
        'لم يعد EasyOrders يقبل وصول أكيد',
        'لإصلاح ذلك افصل EasyOrders من هنا ثم اربط المتجر نفسه من جديد.',
      ],
    ] as const)(
      'says the key was rejected and how to recover, in %s',
      async (locale, title, recovery) => {
        await renderPanel(connected({ health: 'credentials_rejected' }), locale)

        const alert = screen.getByRole('alert')
        expect(alert.textContent).toContain(title)
        expect(alert.textContent).toContain(recovery)
        // Pasting secrets cannot fix a rejected key, so the form is not offered.
        expect(document.querySelector('input[type="password"]')).toBeNull()
      }
    )
  })

  describe('disconnected', () => {
    it('reconnects through EasyOrders without showing the link', async () => {
      await renderPanel(disconnected())
      startInstall.mockResolvedValue({
        installUrl: INSTALL_URL,
        expiresAt: '2026-10-03T12:15:00.000Z',
      })
      fetchStatus.mockResolvedValue(disconnected({ state: 'pending' }))

      fireEvent.click(button('Reconnect EasyOrders'))

      expect(await screen.findByText('Finish in EasyOrders')).toBeTruthy()
      expect(startInstall).toHaveBeenCalledWith('en')
      expect(openedTab.location.replace).toHaveBeenCalledWith(INSTALL_URL)
      expect(document.body.textContent).toContain(
        'Sign in to the same EasyOrders store as before; a different store is refused.'
      )
      expect(document.body.textContent).not.toContain('CALLBACK-TOKEN-VALUE')
    })

    it('explains why a reconnect could not be started', async () => {
      await renderPanel(disconnected())
      startInstall.mockRejectedValue(
        new ApiError('pilot', 403, 'EASYORDERS_PILOT_REQUIRED')
      )

      fireEvent.click(button('Reconnect EasyOrders'))

      expect((await screen.findByRole('alert')).textContent).toBe(
        'Your account isn’t approved for EasyOrders yet.'
      )
      expect(openedTab.close).toHaveBeenCalled()
    })

    it.each([
      [
        disconnected({
          state: 'failed',
          lastErrorCode: 'EASYORDERS_RECONNECT_STORE_MISMATCH',
        }),
        'That is a different EasyOrders store. Only the store that was connected before can be reconnected. Nothing was changed.',
      ],
      [
        disconnected({ state: 'expired' }),
        'The request wasn’t accepted, or it expired. Nothing was connected to your Akeed account.',
      ],
    ])(
      'explains a refused or expired reconnect and offers a retry: %#',
      async (status, message) => {
        await renderPanel(status)

        expect(screen.getByRole('alert').textContent).toBe(message)
        expect(button('Try again').disabled).toBe(false)
      }
    )

    it('does not let a viewer reconnect', async () => {
      await renderPanel(disconnected({ canManage: false }))

      expect(button('Reconnect EasyOrders').disabled).toBe(true)
    })
  })

  it('offers a retry when the connection cannot be loaded', async () => {
    fetchStatus.mockRejectedValueOnce(new Error('offline'))
    fetchStatus.mockResolvedValue(connected())
    renderOnboardingStandalone(<EasyOrdersSourcePanel />, 'en')

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('store-7f3a')).toBeTruthy()
  })
})
