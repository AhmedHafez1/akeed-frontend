import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderOnboardingStandalone } from '@/features/onboarding/ui/standalone/components/onboardingTestUtils'
import { ApiError } from '@/shared/lib/http'
import { queryKeys } from '@/shared/query/keys'
import {
  checkWooCommerceConnection,
  disconnectWooCommerce,
  enableWooCommerceWebhooks,
  fetchWooCommerceConnection,
  startWooCommerceInstall,
} from './wooCommerceApi'
import { openStoreAuthorization } from './wooCommerceNavigation'
import { WooCommerceSourcePanel } from './WooCommerceSourcePanel'
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
vi.mock('./wooCommerceNavigation', () => ({
  openStoreAuthorization: vi.fn(),
}))

const check = vi.mocked(checkWooCommerceConnection)
const disconnect = vi.mocked(disconnectWooCommerce)
const enable = vi.mocked(enableWooCommerceWebhooks)
const fetchStatus = vi.mocked(fetchWooCommerceConnection)
const startInstall = vi.mocked(startWooCommerceInstall)
const assign = vi.mocked(openStoreAuthorization)

const STORE = 'https://shop.example.com/eg'
const STORE_SHOWN = 'shop.example.com/eg'
const CALLBACK_TOKEN = 'CALLBACK-TOKEN-VALUE-NEVER-SHOWN'
const AUTHORIZE_URL = `${STORE}/wc-auth/v1/authorize?app_name=Akeed&scope=read_write&user_id=482910573629104&callback_url=https%3A%2F%2Fapi.akeed.test%2Fapi%2Fwoocommerce%2Finstall%2Fcallback%2F${CALLBACK_TOKEN}`

function connected(
  connection: Partial<WooCommerceConnectionDetails> = {},
  overrides: Partial<WooCommerceConnectionStatus> = {}
): WooCommerceConnectionStatus {
  return {
    state: 'connected',
    canManage: true,
    organizationName: 'متجر نور',
    storeUrl: STORE,
    expiresAt: null,
    lastErrorCode: null,
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
  }
}

const disconnected = (overrides: Partial<WooCommerceConnectionStatus> = {}) =>
  connected(
    { webhooks: [], disconnectedAt: '2026-10-05T09:00:00.000Z' },
    { state: 'disconnected', ...overrides }
  )

const oneDisabled = {
  webhooks: [
    { kind: 'order_created', state: 'active' },
    { kind: 'order_updated', state: 'disabled' },
  ],
} satisfies Partial<WooCommerceConnectionDetails>

async function renderPanel(
  initial: WooCommerceConnectionStatus,
  locale: 'ar' | 'en' = 'en',
  onChanged = vi.fn()
) {
  fetchStatus.mockResolvedValue(initial)
  // Settings mounts the panel beside the health card, under one client.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = renderOnboardingStandalone(
    <QueryClientProvider client={queryClient}>
      <WooCommerceSourcePanel onChanged={onChanged} />
    </QueryClientProvider>,
    locale
  )
  await waitFor(() =>
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
  )
  return { onChanged, container: view.container, queryClient }
}

const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement

describe('WooCommerceSourcePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('connected', () => {
    it.each([
      ['en', 'Active', 'Check connection', 'Disconnect WooCommerce'],
      ['ar', 'مفعّل', 'فحص الربط', 'فصل WooCommerce'],
    ] as const)(
      'shows the store and its order notifications, and no secret, in %s',
      async (locale, active, checkLabel, disconnectLabel) => {
        const { container } = await renderPanel(connected(), locale)

        expect(
          screen.getByText(STORE_SHOWN).closest('bdi')?.getAttribute('dir')
        ).toBe('ltr')
        expect(screen.getAllByText(active)).toHaveLength(2)
        expect(button(checkLabel).disabled).toBe(false)
        expect(button(disconnectLabel)).toBeTruthy()
        // No key, secret or delivery address, and nothing to type.
        expect(container.querySelector('input')).toBeNull()
        expect(container.innerHTML).not.toMatch(
          /ck_|cs_|wc-auth|\/webhooks\/|callback|https:\/\/api\./i
        )
      }
    )

    it('re-enables a disabled notification and tells Settings, without promising the missed orders', async () => {
      const { onChanged } = await renderPanel(connected(oneDisabled))
      expect(document.body.textContent).toContain(
        'Orders placed while it was disabled were not sent to Akeed and are not imported.'
      )
      enable.mockResolvedValue(connected())

      fireEvent.click(button('Re-enable order notifications'))

      expect(
        await screen.findByText(
          'Order notifications are active again. Orders placed while they were disabled are not imported.'
        )
      ).toBeTruthy()
      expect(
        screen.queryByRole('button', { name: 'Re-enable order notifications' })
      ).toBeNull()
      // Settings re-reads its state and the health card.
      expect(onChanged).toHaveBeenCalledTimes(1)
    })

    it.each([
      [
        'en',
        'Order notifications can’t be re-enabled right now. Contact Akeed support.',
        'Re-enable order notifications',
      ],
      [
        'ar',
        'لا يمكن إعادة تفعيل إشعارات الطلبات الآن. تواصل مع دعم أكيد.',
        'إعادة تفعيل إشعارات الطلبات',
      ],
    ] as const)(
      'explains a refused re-enable and changes nothing, in %s',
      async (locale, message, label) => {
        const { onChanged } = await renderPanel(connected(oneDisabled), locale)
        enable.mockRejectedValue(
          new ApiError('off', 503, 'WOOCOMMERCE_WEBHOOK_ENABLE_UNAVAILABLE')
        )

        fireEvent.click(button(label))

        expect(await screen.findByText(message)).toBeTruthy()
        expect(onChanged).not.toHaveBeenCalled()
      }
    )

    it('gives a viewer the state and no way to change it', async () => {
      await renderPanel(connected(oneDisabled, { canManage: false }))

      expect(screen.getByText(STORE_SHOWN)).toBeTruthy()
      expect(
        screen.getByText(
          'You have read-only access. An owner or admin manages the WooCommerce connection.'
        )
      ).toBeTruthy()
      expect(button('Re-enable order notifications').disabled).toBe(true)
      expect(button('Check connection').disabled).toBe(true)
      expect(
        screen.queryByRole('button', { name: 'Disconnect WooCommerce' })
      ).toBeNull()
    })
  })

  describe('after the health card has asked the store', () => {
    it('reads the connection again, so a notification found disabled can be re-enabled here', async () => {
      const { queryClient, onChanged } = await renderPanel(connected())
      expect(
        screen.queryByRole('button', { name: 'Re-enable order notifications' })
      ).toBeNull()
      // The health read stored what the store answered.
      fetchStatus.mockResolvedValue(connected(oneDisabled))

      act(() => {
        queryClient.setQueryData(queryKeys.settings.sourceHealth(), {
          webhooks: { checkedAt: '2026-10-05T09:30:00.000Z', items: [] },
        })
      })

      expect(
        await screen.findByRole('button', {
          name: 'Re-enable order notifications',
        })
      ).toBeTruthy()
      expect(fetchStatus).toHaveBeenCalledTimes(2)
      expect(onChanged).toHaveBeenCalledTimes(1)
    })

    it('does not read again for a health answer it has already seen', async () => {
      const { queryClient } = await renderPanel(connected())
      act(() => {
        queryClient.setQueryData(queryKeys.settings.sourceHealth(), {})
      })
      await waitFor(() => expect(fetchStatus).toHaveBeenCalledTimes(2))

      // Another query changing is not a health read.
      act(() => {
        queryClient.setQueryData(queryKeys.settings.detail(), {})
      })
      await Promise.resolve()

      expect(fetchStatus).toHaveBeenCalledTimes(2)
    })
  })

  describe('connection check', () => {
    it('says so when nothing is wrong', async () => {
      await renderPanel(connected())
      check.mockResolvedValue({
        checkedAt: '2026-10-05T09:30:00.000Z',
        problems: [],
        webhooks: connected().connection!.webhooks,
        status: connected(),
      })

      fireEvent.click(button('Check connection'))

      expect(
        await screen.findByText(
          'Your store answered, accepted Akeed’s access, and both order notifications are active.'
        )
      ).toBeTruthy()
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it.each([
      [
        'WOOCOMMERCE_STORE_TLS_FAILED',
        'Your store’s security certificate is not valid. Ask your hosting provider to fix it.',
      ],
      [
        'WOOCOMMERCE_STORE_ADDRESS_NOT_PUBLIC',
        'Akeed can no longer reach your store’s address on the public internet. Check your domain and its DNS.',
      ],
      [
        'WOOCOMMERCE_REST_UNREACHABLE',
        'Your store did not answer. It may be down, in maintenance mode or blocking outside requests. Try again later or ask your hosting provider.',
      ],
      [
        'WOOCOMMERCE_REST_NOT_FOUND',
        'The WooCommerce REST API is no longer at your store’s address. In WordPress, open Settings > Permalinks and choose any option other than Plain, and make sure WooCommerce is active.',
      ],
      [
        'WOOCOMMERCE_PERMISSION_DENIED',
        'The WordPress user behind Akeed’s API key can no longer manage WooCommerce. Restore that user’s role, or disconnect and connect again as an administrator or shop manager.',
      ],
      [
        'WOOCOMMERCE_CREDENTIALS_REJECTED',
        'Your store no longer accepts Akeed’s API key. It may have been revoked, or your hosting may be removing the Authorization header. Disconnect WooCommerce here, then connect the same store again.',
      ],
      [
        'WOOCOMMERCE_WEBHOOK_MISSING',
        'An order notification was deleted in your store. Disconnect WooCommerce here, then connect the same store again.',
      ],
      [
        'WOOCOMMERCE_WEBHOOK_DISABLED',
        'Your store disabled an order notification. Re-enable it above. Orders placed while it was disabled are not imported.',
      ],
      [
        'A_CODE_FROM_LATER',
        'The check found a problem Akeed can’t name. Contact Akeed support.',
      ],
    ])('explains %s with its own guidance', async (code, message) => {
      await renderPanel(connected())
      check.mockResolvedValue({
        checkedAt: '2026-10-05T09:30:00.000Z',
        problems: [code],
        webhooks: [],
        status: connected(),
      })

      fireEvent.click(button('Check connection'))

      const alert = await screen.findByRole('alert')
      expect(within(alert).getByText(message)).toBeTruthy()
      // A store outside what Akeed supports is sent to support, with no
      // promise that it will work.
      expect(alert.textContent).toContain(
        'Akeed can’t promise it works with every hosting setup or plugin.'
      )
    })

    it('lists every problem it found, in Arabic', async () => {
      await renderPanel(connected(), 'ar')
      check.mockResolvedValue({
        checkedAt: '2026-10-05T09:30:00.000Z',
        problems: [
          'WOOCOMMERCE_STORE_URL_MISMATCH',
          'WOOCOMMERCE_WEBHOOK_PAUSED',
        ],
        webhooks: [],
        status: connected(),
      })

      fireEvent.click(button('فحص الربط'))

      const alert = await screen.findByRole('alert')
      expect(within(alert).getAllByRole('listitem')).toHaveLength(2)
      expect(alert.textContent).toContain(
        'متجرك يعرّف نفسه الآن بعنوان مختلف عن العنوان المربوط'
      )
      expect(alert.textContent).toContain(
        'أحد إشعارات الطلبات موقوف مؤقتًا في متجرك.'
      )
    })

    it('shows what the check changed, and tells Settings', async () => {
      const { onChanged } = await renderPanel(connected())
      check.mockResolvedValue({
        checkedAt: '2026-10-05T09:30:00.000Z',
        problems: ['WOOCOMMERCE_WEBHOOK_DISABLED'],
        webhooks: oneDisabled.webhooks,
        status: connected(oneDisabled),
      })

      fireEvent.click(button('Check connection'))

      expect(await screen.findByText('Disabled by your store')).toBeTruthy()
      expect(button('Re-enable order notifications')).toBeTruthy()
      expect(onChanged).toHaveBeenCalledTimes(1)
    })

    it('says so when the check itself could not run', async () => {
      await renderPanel(connected())
      check.mockRejectedValue(new Error('offline'))

      fireEvent.click(button('Check connection'))

      expect(
        await screen.findByText('We couldn’t run the check. Try again.')
      ).toBeTruthy()
    })
  })

  describe('credentials rejected', () => {
    it.each([
      [
        'en',
        'credentials_rejected',
        'Your store no longer accepts Akeed’s access',
        'To fix it, disconnect WooCommerce here, then connect the same store again.',
      ],
      [
        'ar',
        'permission_denied',
        'لم يعد متجرك يقبل وصول أكيد',
        'لإصلاح ذلك افصل WooCommerce من هنا ثم اربط المتجر نفسه من جديد.',
      ],
    ] as const)(
      'says the store refused Akeed and how to recover, in %s',
      async (locale, health, title, recovery) => {
        await renderPanel(connected({ health }), locale)

        const alert = screen.getByRole('alert')
        expect(alert.textContent).toContain(title)
        expect(alert.textContent).toContain(recovery)
        // Re-enabling cannot fix a rejected key, so it is not offered.
        expect(
          screen.queryByRole('button', {
            name: /Re-enable|إعادة تفعيل/,
          })
        ).toBeNull()
      }
    )
  })

  describe('disconnect', () => {
    it('disconnects after a confirmation, then shows the way back and the key to revoke', async () => {
      const { onChanged } = await renderPanel(connected())
      disconnect.mockResolvedValue({
        ...disconnected(),
        webhookCleanup: 'removed',
      })

      fireEvent.click(button('Disconnect WooCommerce'))
      const dialog = await screen.findByRole('dialog')
      expect(dialog.textContent).toContain(
        'Akeed asks your store to delete its two order notifications.'
      )
      expect(dialog.textContent).toContain(
        'Orders placed while disconnected are not imported.'
      )
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Disconnect' })
      )

      expect(
        await screen.findByText('WooCommerce is disconnected')
      ).toBeTruthy()
      expect(document.body.textContent).toContain(
        'Find the key named Akeed and choose Revoke.'
      )
      expect(document.body.textContent).toContain(
        'Akeed deleted its two order notifications from your store.'
      )
      // Nothing left to delete there, so the third step is not shown.
      expect(document.body.textContent).not.toContain(
        'delete any webhook whose name starts with Akeed'
      )
      expect(button('Reconnect WooCommerce').disabled).toBe(false)
      expect(onChanged).toHaveBeenCalledTimes(1)
    })

    it.each([
      [
        'en',
        'Your store didn’t confirm that Akeed’s order notifications were deleted.',
        'delete any webhook whose name starts with Akeed',
        { open: 'Disconnect WooCommerce', confirm: 'Disconnect' },
      ],
      [
        'ar',
        'لم يؤكد متجرك حذف إشعارات الطلبات الخاصة بأكيد.',
        'احذف أي ويب هوك يبدأ اسمه بـ Akeed',
        { open: 'فصل WooCommerce', confirm: 'فصل' },
      ],
    ] as const)(
      'reports notifications the store did not delete, in %s',
      async (locale, warning, step, labels) => {
        await renderPanel(connected(), locale)
        disconnect.mockResolvedValue({
          ...disconnected(),
          webhookCleanup: 'failed',
        })

        fireEvent.click(button(labels.open))
        const dialog = await screen.findByRole('dialog')
        fireEvent.click(
          within(dialog).getByRole('button', { name: labels.confirm })
        )

        expect((await screen.findByRole('status')).textContent).toContain(
          warning
        )
        expect(document.body.textContent).toContain(step)
      }
    )

    it('keeps the connection when the confirmation is dismissed', async () => {
      const { onChanged } = await renderPanel(connected())

      fireEvent.click(button('Disconnect WooCommerce'))
      const dialog = await screen.findByRole('dialog')
      fireEvent.click(
        within(dialog).getAllByRole('button', { name: 'Keep connected' })[0]
      )

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(disconnect).not.toHaveBeenCalled()
      expect(onChanged).not.toHaveBeenCalled()
    })

    it.each([
      ['en', 'WooCommerce isn’t connected to this account.'],
      ['ar', 'WooCommerce غير مربوط بهذا الحساب.'],
    ] as const)(
      'explains a failed disconnect and changes nothing, in %s',
      async (locale, message) => {
        const labels =
          locale === 'en'
            ? { open: 'Disconnect WooCommerce', confirm: 'Disconnect' }
            : { open: 'فصل WooCommerce', confirm: 'فصل' }
        const { onChanged } = await renderPanel(connected(), locale)
        disconnect.mockRejectedValue(
          new ApiError('gone', 404, 'WOOCOMMERCE_NOT_CONNECTED')
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
  })

  describe('disconnected', () => {
    it('reconnects the same store in this tab, without showing the link or asking for an address', async () => {
      const { container } = await renderPanel(disconnected())
      startInstall.mockResolvedValue({
        authorizeUrl: AUTHORIZE_URL,
        storeUrl: STORE,
        expiresAt: '2026-10-05T10:15:00.000Z',
      })
      // After a reload the screen does not know what the store answered.
      expect(document.body.textContent).toContain(
        'If any are still listed, delete them (step 3).'
      )

      fireEvent.click(button('Reconnect WooCommerce'))

      await waitFor(() => expect(assign).toHaveBeenCalledWith(AUTHORIZE_URL))
      expect(startInstall).toHaveBeenCalledWith(STORE, 'en')
      expect(container.querySelector('input')).toBeNull()
      expect(document.body.textContent).not.toContain(CALLBACK_TOKEN)
    })

    it('explains why a reconnect could not be started', async () => {
      await renderPanel(disconnected())
      startInstall.mockRejectedValue(
        new ApiError('pilot', 403, 'WOOCOMMERCE_PILOT_REQUIRED')
      )

      fireEvent.click(button('Reconnect WooCommerce'))

      expect((await screen.findByRole('alert')).textContent).toBe(
        'Your account isn’t approved for WooCommerce yet.'
      )
      expect(assign).not.toHaveBeenCalled()
    })

    it.each([
      [
        disconnected({
          state: 'failed',
          lastErrorCode: 'WOOCOMMERCE_STORE_UNAVAILABLE',
        }),
        'This store is already connected to another Akeed account.',
      ],
      [
        disconnected({
          state: 'failed',
          lastErrorCode: 'WOOCOMMERCE_CREDENTIALS_REJECTED',
        }),
        /^Your store did not accept the new API key\./,
      ],
      [
        disconnected({ state: 'expired' }),
        'The connection request expired before your store finished. Nothing was connected.',
      ],
    ])(
      'explains a refused or expired reconnect and offers a retry: %#',
      async (status, message) => {
        await renderPanel(status)

        const alert = screen.getByRole('alert')
        if (typeof message === 'string') expect(alert.textContent).toBe(message)
        else expect(alert.textContent).toMatch(message)
        expect(document.body.textContent).toContain(
          'Approve again in the same WooCommerce store as before; a different store is refused.'
        )
        expect(button('Try again').disabled).toBe(false)
      }
    )

    it('shows a reconnect that is waiting for the store', async () => {
      await renderPanel(disconnected({ state: 'pending' }))

      expect(screen.getByText('Finishing the connection')).toBeTruthy()
      expect(screen.getByRole('status').textContent).toBe(
        'Your store is sending Akeed its access. This page updates by itself.'
      )
    })

    it('does not let a viewer reconnect', async () => {
      await renderPanel(disconnected({ canManage: false }))

      expect(button('Reconnect WooCommerce').disabled).toBe(true)
    })
  })

  it('offers a retry when the connection cannot be loaded', async () => {
    fetchStatus.mockRejectedValueOnce(new Error('offline'))
    fetchStatus.mockResolvedValue(connected())
    renderOnboardingStandalone(
      <QueryClientProvider client={new QueryClient()}>
        <WooCommerceSourcePanel />
      </QueryClientProvider>,
      'en'
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText(STORE_SHOWN)).toBeTruthy()
  })
})
