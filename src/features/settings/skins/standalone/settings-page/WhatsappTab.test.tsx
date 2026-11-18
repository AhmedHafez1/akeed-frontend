import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
import en from '../../../../../../public/messages/en.json'
import { ApiError } from '@/shared/lib/http'
import {
  disconnectWhatsapp,
  getWhatsappConnection,
  getWhatsappSender,
  issueConnectTicket,
  updateWhatsappThankYou,
} from '@/features/whatsapp-connect/api/whatsappConnectApi'
import { fetchCreditSummary } from '@/features/billing/api/billingApi'
import {
  availabilityFixture,
  connectionFixture,
  templateFixture,
} from '@/features/whatsapp-connect/testing/whatsappFixtures'
import { WhatsappTab } from './WhatsappTab'

vi.mock(
  '@/features/whatsapp-connect/api/whatsappConnectApi',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/features/whatsapp-connect/api/whatsappConnectApi')
    >()),
    getWhatsappSender: vi.fn(),
    getWhatsappConnection: vi.fn(),
    issueConnectTicket: vi.fn(),
    updateWhatsappThankYou: vi.fn(),
    disconnectWhatsapp: vi.fn(),
  })
)

vi.mock('@/features/billing/api/billingApi', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/billing/api/billingApi')
  >()),
  fetchCreditSummary: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/settings',
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

const sender = vi.mocked(getWhatsappSender)
const connection = vi.mocked(getWhatsappConnection)
const issue = vi.mocked(issueConnectTicket)
const thankYou = vi.mocked(updateWhatsappThankYou)
const disconnect = vi.mocked(disconnectWhatsapp)
const credits = vi.mocked(fetchCreditSummary)
const copy = en.whatsappConnect.tab

function renderTab(locale: 'en' | 'ar' = 'en') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === 'en' ? en : ar}
        timeZone="UTC"
      >
        <WhatsappTab />
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  sender.mockReset().mockResolvedValue(availabilityFixture())
  connection.mockReset().mockResolvedValue({ connection: connectionFixture() })
  issue.mockReset()
  thankYou.mockReset().mockResolvedValue({ thankYouEnabled: false })
  disconnect.mockReset()
  credits.mockReset().mockResolvedValue({
    price: {
      unitPriceMinor: 100,
      messagePriceMinor: 200,
      creditsPerMessage: 2,
      ownNumberCreditsPerMessage: 1,
      currency: 'EGP',
    },
  } as Awaited<ReturnType<typeof fetchCreditSummary>>)
})

afterEach(() => vi.restoreAllMocks())

describe('standalone WhatsApp tab before connecting', () => {
  beforeEach(() => {
    connection.mockResolvedValue({ connection: null })
  })

  it('offers a concise connect card without progress before connection', async () => {
    renderTab()
    const button = await screen.findByRole('button', {
      name: copy.connect.action,
    })
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(screen.queryByRole('list', { name: copy.progress.label })).toBeNull()
    expect(screen.queryByRole('switch')).toBeNull()
  })
  it('shows the action to others but leaves it to the owner', async () => {
    sender.mockResolvedValue(
      availabilityFixture({
        canConnect: false,
        permissions: { canDisconnect: false, canUpdateThankYou: true },
      })
    )
    renderTab()
    const button = await screen.findByRole('button', {
      name: copy.connect.action,
    })
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(screen.getByText(copy.connect.ownerOnly)).toBeTruthy()
  })

  it('opens the new tab inside the click and sends it to the connect page', async () => {
    const tab = {
      opener: {} as unknown,
      closed: false,
      close: vi.fn(),
      location: { replace: vi.fn() },
    }
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as never)
    issue.mockResolvedValue({
      connectUrl: 'https://app.example.test/en/whatsapp/connect?ticket=x',
      expiresAt: '2026-11-04T10:00:00.000Z',
    })
    renderTab()
    fireEvent.click(
      await screen.findByRole('button', { name: copy.connect.action })
    )
    expect(open).toHaveBeenCalledWith('', '_blank')
    expect(tab.opener).toBeNull()
    await waitFor(() => expect(tab.location.replace).toHaveBeenCalled())
    expect(await screen.findByText(copy.connect.opened)).toBeTruthy()
  })

  it('offers a link when the browser blocks the tab, and explains a refused ticket', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    issue.mockResolvedValueOnce({
      connectUrl: 'https://app.example.test/en/whatsapp/connect?ticket=x',
      expiresAt: '2026-11-04T10:00:00.000Z',
    })
    renderTab()
    const button = await screen.findByRole('button', {
      name: copy.connect.action,
    })
    fireEvent.click(button)
    expect(
      await screen.findByRole('link', {
        name: en.whatsappConnect.card.openLink,
      })
    ).toBeTruthy()
    issue.mockRejectedValueOnce(
      new ApiError('x', 403, 'WHATSAPP_CONNECTION_OWNER_REQUIRED')
    )
    fireEvent.click(button)
    expect(
      await screen.findByText(en.whatsappConnect.errors.ownerRequired)
    ).toBeTruthy()
  })

  it('shows nothing while connecting is unavailable and nothing is connected', async () => {
    sender.mockResolvedValue(availabilityFixture({ available: false }))
    const { container } = renderTab()
    await waitFor(() => expect(connection).toHaveBeenCalled())
    await waitFor(() => expect(container.textContent).toBe(''))
  })
})

describe('standalone WhatsApp tab with a connection', () => {
  it('explains unavailable reconnection to the owner without asking them to ask themselves', async () => {
    sender.mockResolvedValue(availabilityFixture({ available: false }))
    connection.mockResolvedValue({
      connection: connectionFixture({ state: 'disconnected' }),
    })
    renderTab()
    expect(
      await screen.findByText(copy.progress.issues.unavailable)
    ).toBeTruthy()
    expect(screen.queryByText(copy.banners.askOwner)).toBeNull()
    expect(screen.queryByRole('list', { name: copy.progress.label })).toBeNull()
    expect(
      screen.queryByRole('button', { name: copy.reconnect.action })
    ).toBeNull()
  })
  it('shows partial approval in three rows without template inventory or send history', async () => {
    connection.mockResolvedValue({
      connection: connectionFixture({
        templateDetails: [
          templateFixture('cod_confirm.ar.standard', 'ar'),
          templateFixture('cod_confirm.en.standard', 'en', {
            status: 'pending',
            readiness: { kind: 'akeed_system', reason: 'template_pending' },
          }),
        ],
      }),
    })
    renderTab()
    const list = await screen.findByRole('list', { name: copy.progress.label })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(
      within(list).getByText(copy.progress.statuses.someApproved)
    ).toBeTruthy()
    expect(
      within(list).getByText(copy.progress.statuses.someMessages)
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByText(copy.last.confirmation)).toBeNull()
    expect(screen.queryByRole('switch')).toBeNull()
  })
  it('places a payment problem beside sending, even after an earlier successful send', async () => {
    connection.mockResolvedValue({
      connection: connectionFixture({
        health: {
          stateReason: null,
          qualityRating: 'GREEN',
          degradedClass: 'payment',
          lastCheckedAt: null,
        },
        templateDetails: [
          templateFixture('cod_confirm.ar.standard', 'ar', {
            readiness: { kind: 'akeed_system', reason: 'degraded:payment' },
          }),
        ],
      }),
    })
    renderTab()
    expect(await screen.findByText(copy.progress.issues.payment)).toBeTruthy()
    expect(screen.getByText(copy.progress.statuses.approved)).toBeTruthy()
    expect(screen.queryByText(copy.progress.statuses.ready)).toBeNull()
    expect(
      screen
        .getByRole('link', { name: copy.progress.actions.manager })
        .getAttribute('href')
    ).toContain('business.facebook.com')
  })
  it('shows disabled sending beside its row', async () => {
    sender.mockResolvedValue(availabilityFixture({ sendingEnabled: false }))
    renderTab()
    expect(
      await screen.findByText(copy.progress.issues.sendingOff)
    ).toBeTruthy()
    expect(screen.getByText(copy.progress.statuses.paused)).toBeTruthy()
  })
  it('keeps thank-you management exclusively in Message settings', async () => {
    renderTab()
    await screen.findByRole('list', { name: copy.progress.label })
    expect(screen.queryByRole('switch')).toBeNull()
    expect(thankYou).not.toHaveBeenCalled()
  })
  it('leaves disconnect read-only for a viewer', async () => {
    sender.mockResolvedValue(
      availabilityFixture({
        canConnect: false,
        permissions: { canDisconnect: false, canUpdateThankYou: false },
      })
    )
    renderTab()
    const disconnectButton = await screen.findByRole('button', {
      name: copy.disconnect.action,
    })
    expect(disconnectButton.hasAttribute('disabled')).toBe(true)
    expect(screen.queryByRole('switch')).toBeNull()
  })
  it('disconnects after confirming and lists the WhatsApp Business app steps', async () => {
    disconnect.mockResolvedValue({
      state: 'disconnected',
      providerCleanup: 'manual_required',
      businessAppSteps: [
        'settings',
        'account',
        'business_platform',
        'disconnect',
      ],
    })
    renderTab()
    fireEvent.click(
      await screen.findByRole('button', { name: copy.disconnect.action })
    )
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(copy.disconnect.coexistence, { exact: false })
    ).toBeTruthy()
    connection.mockResolvedValue({
      connection: connectionFixture({ state: 'disconnected' }),
    })
    fireEvent.click(
      within(dialog).getByRole('button', { name: copy.disconnect.confirm })
    )
    expect(await screen.findByText(copy.disconnect.done)).toBeTruthy()
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(
      screen.getByText(copy.disconnect.appSteps.business_platform)
    ).toBeTruthy()
    expect(screen.getByText(copy.disconnect.cleanupManual)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: copy.reconnect.action })
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('keeps the dialog open with an error when disconnecting fails', async () => {
    disconnect.mockRejectedValue(new ApiError('x', 500))
    renderTab()
    fireEvent.click(
      await screen.findByRole('button', { name: copy.disconnect.action })
    )
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(
      within(dialog).getByRole('button', { name: copy.disconnect.confirm })
    )
    expect(await within(dialog).findByText(copy.disconnect.error)).toBeTruthy()
  })

  it('asks to disconnect first when an offboarded number needs reconnecting', async () => {
    sender.mockResolvedValue(
      availabilityFixture({
        alerts: [
          {
            kind: 'disconnect',
            reason: 'offboarded',
            severity: 'critical',
            action: 'reconnect',
            templates: [],
          },
        ],
      })
    )
    connection.mockResolvedValue({
      connection: connectionFixture({ state: 'offboarded' }),
    })
    renderTab()
    expect(await screen.findByText(copy.banners.reconnectFirst)).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: copy.reconnect.action })
    ).toBeNull()
  })

  it('reports a failed read without showing any status, and retries', async () => {
    connection.mockRejectedValueOnce(new ApiError('x', 500))
    renderTab()
    expect(await screen.findByText(copy.load.title)).toBeTruthy()
    expect(screen.queryByText(copy.progress.statuses.ready)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: copy.load.retry }))
    expect(await screen.findByText(copy.progress.statuses.ready)).toBeTruthy()
  })
})

describe('standalone WhatsApp tab in Arabic', () => {
  it('translates the status rows and keeps the number left to right', async () => {
    renderTab('ar')
    const tab = ar.whatsappConnect.tab
    expect(await screen.findByText(tab.progress.statuses.ready)).toBeTruthy()
    expect(screen.getByText(tab.progress.labels.templates)).toBeTruthy()
    const numbers = screen.getAllByText('+20 100 555 0101')
    expect(numbers.every((node) => node.getAttribute('dir') === 'ltr')).toBe(
      true
    )
  })
})
