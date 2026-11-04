import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppProvider } from '@shopify/polaris'
import polaris from '@shopify/polaris/locales/en.json'
import { NextIntlClientProvider } from 'next-intl'
import en from '../../../../../../public/messages/en.json'
import { ApiError } from '@/shared/lib/http'
import {
  disconnectWhatsapp,
  getWhatsappConnection,
  getWhatsappSender,
  updateWhatsappThankYou,
} from '@/features/whatsapp-connect/api/whatsappConnectApi'
import {
  availabilityFixture,
  connectionFixture,
  templateFixture,
} from '@/features/whatsapp-connect/testing/whatsappFixtures'
import type { UsagePools } from '@/shared/types/usagePools'
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

const sender = vi.mocked(getWhatsappSender)
const connection = vi.mocked(getWhatsappConnection)
const thankYou = vi.mocked(updateWhatsappThankYou)
const disconnect = vi.mocked(disconnectWhatsapp)
const copy = en.whatsappConnect.tab

const pools: UsagePools = {
  akeed: { used: 138, limit: 300, remaining: 162 },
  ownNumber: { used: 360, limit: 900, remaining: 540 },
}

function renderTab(tabPools: UsagePools | null = pools) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <AppProvider i18n={polaris}>
          <WhatsappTab pools={tabPools} />
        </AppProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  sender.mockReset().mockResolvedValue(availabilityFixture())
  connection.mockReset().mockResolvedValue({ connection: connectionFixture() })
  thankYou.mockReset().mockResolvedValue({ thankYouEnabled: false })
  disconnect.mockReset()
})

describe('embedded WhatsApp tab', () => {
  it('shows both plan pools before connecting', async () => {
    connection.mockResolvedValue({ connection: null })
    renderTab()
    expect(
      await screen.findByRole('button', { name: copy.connect.action })
    ).toBeTruthy()
    expect(screen.getByText('300 messages')).toBeTruthy()
    expect(screen.getByText('+900 messages')).toBeTruthy()
    expect(screen.getByText(copy.costs.poolNote)).toBeTruthy()
  })

  it('renders template readiness per language with the current sender', async () => {
    connection.mockResolvedValue({
      connection: connectionFixture({
        templateDetails: [
          templateFixture('cod_confirm.ar.standard', 'ar'),
          templateFixture('cod_reminder.fr.standard', 'fr', {
            status: 'rejected',
            readiness: { kind: 'akeed_system', reason: 'template_rejected' },
          }),
        ],
      }),
    })
    renderTab()
    expect(await screen.findByText(copy.readiness.templatesVary)).toBeTruthy()
    expect(screen.getByText(copy.status.connected)).toBeTruthy()
    const table = screen.getByRole('table')
    expect(within(table).getByText('Arabic')).toBeTruthy()
    expect(within(table).getByText('French')).toBeTruthy()
    expect(within(table).getByText(copy.templates.status.rejected)).toBeTruthy()
    expect(within(table).getByText(copy.sender.akeed)).toBeTruthy()
  })

  it('keeps a viewer read-only', async () => {
    sender.mockResolvedValue(
      availabilityFixture({
        canConnect: false,
        permissions: { canDisconnect: false, canUpdateThankYou: false },
      })
    )
    renderTab()
    const checkbox = await screen.findByRole('checkbox', {
      name: copy.thankYou.heading,
    })
    expect(checkbox.hasAttribute('disabled')).toBe(true)
    expect(
      screen
        .getByRole('button', { name: copy.disconnect.action })
        .getAttribute('aria-disabled')
    ).toBe('true')
  })

  it('saves the thank-you setting', async () => {
    renderTab()
    fireEvent.click(
      await screen.findByRole('checkbox', { name: copy.thankYou.heading })
    )
    await waitFor(() => expect(thankYou).toHaveBeenCalledTimes(1))
    expect(thankYou.mock.calls[0][0]).toBe(false)
  })

  it('disconnects through the modal and shows the app steps', async () => {
    disconnect.mockResolvedValue({
      state: 'disconnected',
      providerCleanup: 'succeeded',
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
    connection.mockResolvedValue({
      connection: connectionFixture({ state: 'disconnected' }),
    })
    fireEvent.click(
      within(dialog).getByRole('button', { name: copy.disconnect.confirm })
    )
    expect(await screen.findByText(copy.disconnect.done)).toBeTruthy()
    expect(screen.getByText(copy.disconnect.appSteps.disconnect)).toBeTruthy()
    expect(screen.queryByText(copy.disconnect.cleanupManual)).toBeNull()
  })

  it('explains a failed read', async () => {
    sender.mockRejectedValue(new ApiError('x', 500))
    renderTab()
    expect(await screen.findByText(copy.load.title)).toBeTruthy()
  })
})
