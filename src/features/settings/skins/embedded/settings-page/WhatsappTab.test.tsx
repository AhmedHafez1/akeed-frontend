import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <AppProvider i18n={polaris}>
          <WhatsappTab />
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
  it('shows a concise connect card before connecting', async () => {
    connection.mockResolvedValue({ connection: null })
    renderTab()
    expect(
      await screen.findByRole('button', { name: copy.connect.action })
    ).toBeTruthy()
    expect(screen.queryByRole('list', { name: copy.progress.label })).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })
  it('shows three status rows and keeps partial approvals distinct', async () => {
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
    const list = await screen.findByRole('list', { name: copy.progress.label })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(
      within(list).getByText(copy.progress.statuses.someApproved)
    ).toBeTruthy()
    expect(within(list).getByText(copy.progress.issues.templates)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })
  it('keeps a viewer read-only', async () => {
    sender.mockResolvedValue(
      availabilityFixture({
        canConnect: false,
        permissions: { canDisconnect: false, canUpdateThankYou: false },
      })
    )
    renderTab()
    const button = await screen.findByRole('button', {
      name: copy.disconnect.action,
    })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(screen.queryByRole('checkbox')).toBeNull()
  })
  it('has no duplicate thank-you preference', async () => {
    renderTab()
    await screen.findByRole('list', { name: copy.progress.label })
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(thankYou).not.toHaveBeenCalled()
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

  it('explains a failed read and recovers with Retry', async () => {
    sender.mockRejectedValueOnce(new ApiError('x', 500))
    renderTab()
    expect(await screen.findByText(copy.load.title)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: copy.load.retry }))
    expect(await screen.findByText(copy.progress.statuses.ready)).toBeTruthy()
  })
})
