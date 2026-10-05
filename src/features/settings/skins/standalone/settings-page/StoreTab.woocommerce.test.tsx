import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import type { IntegrationOnboardingState } from '@/features/onboarding'
import { settingsResponseFixture } from '../../../testing/settingsFixture'
import { SettingsStandalonePage } from './SettingsStandalonePage'

const nav = vi.hoisted(() => ({
  search: new URLSearchParams({ tab: 'store' }),
  push: vi.fn(),
  replace: vi.fn(),
}))

const api = vi.hoisted(() => ({
  fetchSettings: vi.fn(),
  saveSettings: vi.fn(),
}))

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

vi.mock('../../../api/settingsApi', () => api)

/** What the WooCommerce panel and the health card read, by path. */
const backend = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/shared/lib/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/shared/lib/auth')>()
  return { ...original, api: { ...original.api, get: backend.get } }
})

type SourceSetup = NonNullable<IntegrationOnboardingState['sourceSetup']>
type State = 'connected' | 'disconnected'

const STORE = 'https://shop.example.com/eg'
const store = ar.settings.standalone.page.store
const woo = ar.wooCommerceConnect

const sourceSetup = (state: State): SourceSetup => ({
  connectionState: state,
  disconnectedAt: state === 'disconnected' ? '2026-10-05T09:00:00.000Z' : null,
  store: { reference: STORE, verified: state === 'connected' },
  // Not setup inputs for this source: every order carries its own.
  orderDefaults: { currency: null, phoneCountry: null },
  sender: { sender: 'akeed_shared', status: 'configured' },
  canComplete: state === 'connected',
  blockedReasons: state === 'disconnected' ? ['source_disconnected'] : [],
})

const connection = (state: State, disabled: boolean) => ({
  state,
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
    webhooks:
      state === 'connected'
        ? [
            { kind: 'order_created', state: 'active' },
            {
              kind: 'order_updated',
              state: disabled ? 'disabled' : 'active',
            },
          ]
        : [],
    webhooksCheckedAt: '2026-10-04T10:00:00.000Z',
    disconnectedAt:
      state === 'disconnected' ? '2026-10-05T09:00:00.000Z' : null,
  },
})

const health = (state: State, disabled: boolean) => ({
  integrationId: 'int-1',
  platformType: 'woocommerce',
  connectionState: state,
  disconnectedAt: null,
  windowDays: 7,
  credentials: { status: state === 'connected' ? 'ok' : 'removed' },
  events: { lastAcceptedAt: null, acceptedCount: 0 },
  processing: { failedCount: 0, lastFailedAt: null },
  backlog: { waitingCount: 0, oldestWaitingAt: null },
  remoteSync: {
    failedCount: 0,
    lastFailedAt: null,
    pendingCount: 0,
    requiresAssistance: false,
  },
  delivery: { secretsMissing: false, rejectedCount: 0, lastRejectedAt: null },
  capabilities: [],
  ...(state === 'connected'
    ? {
        webhooks: {
          checkedAt: '2026-10-05T09:30:00.000Z',
          items: connection(state, disabled).connection.webhooks,
        },
      }
    : {}),
})

function serveWooCommerce(state: State, options = { disabled: false }) {
  api.fetchSettings.mockResolvedValue(
    settingsResponseFixture({
      state: {
        source: { platformType: 'woocommerce', identity: 'woocommerce:org-1' },
        sourceSetup: sourceSetup(state),
      },
    })
  )
  backend.get.mockImplementation((path: string) =>
    Promise.resolve(
      path === '/api/settings/source-health'
        ? health(state, options.disabled)
        : connection(state, options.disabled)
    )
  )
}

async function renderStore() {
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
  await screen.findByRole('heading', { name: store.codHeading })
  return view
}

/** The order-source tab for a WooCommerce source (US-07-05). */
describe('standalone Store tab with a WooCommerce source', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nav.search = new URLSearchParams({ tab: 'store' })
  })

  it('names the source and shows its connection panel and its health, with no secret', async () => {
    serveWooCommerce('connected')
    const { container } = await renderStore()

    expect(
      screen.getByRole('heading', { level: 3, name: 'WooCommerce' })
    ).toBeTruthy()
    expect(screen.getByText(store.sourceHelpWooCommerce)).toBeTruthy()
    expect(screen.getByText('متصل')).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 2, name: store.connectionHeading })
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 2, name: store.health.heading })
    ).toBeTruthy()
    expect(
      await screen.findByRole('button', { name: woo.disconnect.button })
    ).toBeTruthy()
    expect(
      await screen.findByRole('button', { name: woo.check.button })
    ).toBeTruthy()
    // Each webhook is its own health row.
    expect(
      await screen.findByText(store.health.webhooks.kinds.order_created)
    ).toBeTruthy()
    expect(
      screen.getByText(store.health.webhooks.kinds.order_updated)
    ).toBeTruthy()
    expect(await screen.findByText(store.health.lastEvent.none)).toBeTruthy()
    expect(container.innerHTML).not.toMatch(
      /ck_|cs_|wc-auth|\/api\/woocommerce\/webhooks\/|callback/i
    )
  })

  it('offers the re-enable where a notification is disabled, and health says missed orders are not imported', async () => {
    serveWooCommerce('connected', { disabled: true })
    await renderStore()

    expect(
      await screen.findByRole('button', { name: woo.webhooks.disabled.enable })
    ).toBeTruthy()
    expect(
      await screen.findByText(store.health.webhooks.notes.disabled)
    ).toBeTruthy()
    expect(document.body.textContent).toContain(
      woo.webhooks.disabled.missedOrders
    )
  })

  it('offers the re-enable once the health read has found the notification disabled, without a reload', async () => {
    serveWooCommerce('connected')
    // The status holds what was last stored: active, until health is read.
    let healthRead = false
    backend.get.mockImplementation((path: string) => {
      if (path === '/api/settings/source-health') {
        healthRead = true
        return Promise.resolve(health('connected', true))
      }
      return Promise.resolve(connection('connected', healthRead))
    })
    await renderStore()

    expect(
      await screen.findByRole('button', { name: woo.webhooks.disabled.enable })
    ).toBeTruthy()
    // The panel and the health card now say the same thing.
    await waitFor(() =>
      expect(
        screen.getAllByText(store.health.webhooks.states.disabled)
      ).toHaveLength(2)
    )
  })

  it('shows a disconnected source as disconnected, locks its settings and offers the same store back', async () => {
    serveWooCommerce('disconnected')
    await renderStore()

    expect(screen.getByText(store.disconnected)).toBeTruthy()
    expect(screen.queryByText('متصل')).toBeNull()
    expect(
      screen.getByText(ar.settings.standalone.messages.sourceDisconnected)
    ).toBeTruthy()
    expect(
      (
        screen.getByRole('switch', {
          name: store.codLabel,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(
      await screen.findByRole('button', { name: woo.disconnected.reconnect })
    ).toBeTruthy()
    expect(await screen.findByText(woo.removal.steps.revokeKey)).toBeTruthy()
    expect(
      await screen.findByText(store.health.credentials.removed)
    ).toBeTruthy()
    // No key is held, so no webhook can be read.
    expect(
      screen.queryByText(store.health.webhooks.kinds.order_created)
    ).toBeNull()
  })
})
