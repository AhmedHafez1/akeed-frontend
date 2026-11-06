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

  it('offers the owner the connect action with both rates from the server', async () => {
    renderTab()
    const button = await screen.findByRole('button', {
      name: copy.connect.action,
    })
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(await screen.findByText('2 credits / message')).toBeTruthy()
    expect(screen.getByText('1 credit / message')).toBeTruthy()
    expect(screen.getByText(copy.costs.creditNote)).toBeTruthy()
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
    expect(screen.getByText(copy.permissions.title)).toBeTruthy()
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
  it('keeps current readiness, each template sender and the last send apart', async () => {
    sender.mockResolvedValue(
      availabilityFixture({
        lastAccepted: {
          confirmation: {
            kind: 'merchant_own',
            reason: 'own_number',
            acceptedAt: '2026-11-04T08:42:00.000Z',
            deliveryStatus: 'read',
          },
          reminder: null,
        },
      })
    )
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
    expect(await screen.findByText(copy.readiness.templatesVary)).toBeTruthy()
    expect(screen.getByText(copy.banners.templatesInReview.title)).toBeTruthy()
    const table = screen.getByRole('table', { name: copy.templates.tableLabel })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('Arabic')).toBeTruthy()
    expect(within(rows[0]).getByText(copy.sender.yourNumber)).toBeTruthy()
    expect(within(rows[1]).getByText('English')).toBeTruthy()
    expect(
      within(rows[1]).getByText(copy.templates.status.pending)
    ).toBeTruthy()
    expect(within(rows[1]).getByText(copy.sender.akeed)).toBeTruthy()
    expect(screen.getByText(copy.last.confirmation)).toBeTruthy()
    expect(screen.getByText(copy.last.historical)).toBeTruthy()
    const last = screen.getByText(copy.last.confirmation).parentElement
    expect(last?.textContent).toContain(copy.sender.yourNumber)
    expect(last?.textContent).toContain(copy.last.delivery.read)
  })

  it('never reads a degraded number as ready, whatever was sent before', async () => {
    sender.mockResolvedValue(
      availabilityFixture({
        alerts: [
          {
            kind: 'payment',
            reason: 'payment',
            severity: 'critical',
            action: 'whatsapp_manager',
            templates: [],
          },
        ],
        lastAccepted: {
          confirmation: {
            kind: 'merchant_own',
            reason: 'own_number',
            acceptedAt: '2026-11-04T08:00:00.000Z',
            deliveryStatus: 'delivered',
          },
          reminder: null,
        },
      })
    )
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
    expect(await screen.findByText(copy.readiness.degradedPayment)).toBeTruthy()
    expect(screen.queryByText(copy.readiness.ready)).toBeNull()
    expect(screen.getByRole('alert').textContent).toContain(
      copy.banners.payment.payment.title
    )
    expect(screen.getByRole('alert').textContent).toContain(
      copy.banners.resumes
    )
    expect(screen.getByText(copy.templates.footer.degraded)).toBeTruthy()
  })

  it('says sending is switched off without promising recovery', async () => {
    sender.mockResolvedValue(availabilityFixture({ sendingEnabled: false }))
    renderTab()
    expect(await screen.findByText(copy.banners.sendingOff.title)).toBeTruthy()
    expect(screen.getByText(copy.readiness.sendingOff)).toBeTruthy()
    expect(
      screen.queryByText(copy.banners.resumes, { exact: false })
    ).toBeNull()
  })

  it('saves the thank-you switch once, and reports a failure', async () => {
    let finish: (value: { thankYouEnabled: boolean }) => void = () => {}
    thankYou.mockImplementationOnce(
      () => new Promise((resolve) => (finish = resolve))
    )
    renderTab()
    const toggle = await screen.findByRole('switch', {
      name: copy.thankYou.heading,
    })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    await waitFor(() => expect(thankYou).toHaveBeenCalledTimes(1))
    expect(thankYou.mock.calls[0][0]).toBe(false)
    finish({ thankYouEnabled: false })
    thankYou.mockRejectedValueOnce(new ApiError('x', 500))
    await waitFor(() => expect(toggle.hasAttribute('disabled')).toBe(false))
    fireEvent.click(toggle)
    expect(await screen.findByText(copy.thankYou.error)).toBeTruthy()
  })

  it('leaves everything read-only for a viewer', async () => {
    sender.mockResolvedValue(
      availabilityFixture({
        canConnect: false,
        permissions: { canDisconnect: false, canUpdateThankYou: false },
      })
    )
    renderTab()
    const toggle = await screen.findByRole('switch', {
      name: copy.thankYou.heading,
    })
    expect(toggle.hasAttribute('disabled')).toBe(true)
    expect(screen.getByText(copy.thankYou.readOnly)).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: copy.disconnect.action })
        .hasAttribute('disabled')
    ).toBe(true)
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
    expect(screen.queryByText(copy.readiness.ready)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: copy.load.retry }))
    expect(await screen.findByText(copy.readiness.ready)).toBeTruthy()
  })
})

describe('standalone WhatsApp tab in Arabic', () => {
  it('names message languages in Arabic and keeps the number left to right', async () => {
    renderTab('ar')
    const tab = ar.whatsappConnect.tab
    expect(await screen.findByText(tab.readiness.ready)).toBeTruthy()
    expect(screen.getByText('العربية')).toBeTruthy()
    const numbers = screen.getAllByText('+20 100 555 0101')
    expect(numbers.every((node) => node.getAttribute('dir') === 'ltr')).toBe(
      true
    )
  })
})
