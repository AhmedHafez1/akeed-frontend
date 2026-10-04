import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderOnboardingStandalone } from '@/features/onboarding/ui/standalone/components/onboardingTestUtils'
import { ApiError } from '@/shared/lib/http'
import {
  fetchWooCommerceConnection,
  startWooCommerceInstall,
} from './wooCommerceApi'
import { WooCommerceConnectPage } from './WooCommerceConnectPage'
import { openStoreAuthorization } from './wooCommerceNavigation'
import type { WooCommerceConnectionStatus } from './wooCommerce.types'

vi.mock('./wooCommerceApi', () => ({
  fetchWooCommerceConnection: vi.fn(),
  startWooCommerceInstall: vi.fn(),
}))
vi.mock('./wooCommerceNavigation', () => ({
  openStoreAuthorization: vi.fn(),
}))

const fetchStatus = vi.mocked(fetchWooCommerceConnection)
const startInstall = vi.mocked(startWooCommerceInstall)
const assign = vi.mocked(openStoreAuthorization)

const STORE = 'https://shop.example.com/eg'
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

const connected = status({
  state: 'connected',
  storeUrl: STORE,
  connection: {
    storeUrl: STORE,
    health: 'ok',
    connectedAt: '2026-10-04T10:00:00.000Z',
  },
})

async function renderPage(
  initial: WooCommerceConnectionStatus,
  locale: 'ar' | 'en' = 'ar'
) {
  fetchStatus.mockResolvedValue(initial)
  const view = renderOnboardingStandalone(<WooCommerceConnectPage />, locale)
  await screen.findByRole('heading', { level: 1 })
  return view
}

describe('WooCommerceConnectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    window.history.replaceState(null, '', '/ar/onboarding')
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
      renderOnboardingStandalone(<WooCommerceConnectPage />, 'en')

      expect(
        await screen.findByRole('heading', { name: 'Finishing the connection' })
      ).toBeTruthy()
      expect(screen.getByText(STORE).closest('bdi')?.getAttribute('dir')).toBe(
        'ltr'
      )
      // The hint is read once and taken out of the address.
      expect(window.location.search).toBe('')

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000)
      })
      expect(
        await screen.findByRole('heading', {
          name: 'Your WooCommerce store is connected',
        })
      ).toBeTruthy()
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
      expect(screen.getByText(STORE)).toBeTruthy()
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

      expect(screen.getByText(STORE)).toBeTruthy()
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
