import type { ComponentType } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppProvider } from '@shopify/polaris'
import polaris from '@shopify/polaris/locales/en.json'
import { NextIntlClientProvider } from 'next-intl'
import en from '../../../../public/messages/en.json'
import ar from '../../../../public/messages/ar.json'
import { ApiError } from '@/shared/lib/http'
import {
  getWhatsappSender,
  issueConnectTicket,
  type WhatsappSenderAvailability,
} from '../api/whatsappConnectApi'
import { WhatsappConnectCard as Standalone } from './standalone/WhatsappConnectCard'
import { WhatsappConnectCard as Embedded } from './embedded/WhatsappConnectCard'

vi.mock('../api/whatsappConnectApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/whatsappConnectApi')>()),
  getWhatsappSender: vi.fn(),
  issueConnectTicket: vi.fn(),
}))

const availability = vi.mocked(getWhatsappSender)
const issue = vi.mocked(issueConnectTicket)
const URL_WITH_TICKET = `https://app.example.test/ar/whatsapp/connect?ticket=${'T'.repeat(43)}`

const owner: WhatsappSenderAvailability = {
  available: true,
  appId: '1',
  configId: '2',
  canConnect: true,
}

function renderCard(
  Card: ComponentType,
  locale: 'en' | 'ar' = 'en'
): ReturnType<typeof render> {
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
        <AppProvider i18n={polaris}>
          <Card />
        </AppProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

function fakeTab() {
  return {
    opener: {} as unknown,
    closed: false,
    close: vi.fn(),
    location: { replace: vi.fn() },
  }
}

beforeEach(() => {
  availability.mockReset().mockResolvedValue(owner)
  issue.mockReset().mockResolvedValue({
    connectUrl: URL_WITH_TICKET,
    expiresAt: new Date().toISOString(),
  })
})

describe.each([
  ['standalone', Standalone],
  ['embedded', Embedded],
] as const)('%s connect card', (_skin, Card) => {
  it('offers connecting to the owner when the backend says it is available', async () => {
    renderCard(Card)
    expect(
      await screen.findByRole('button', {
        name: en.whatsappConnect.card.action,
      })
    ).toBeTruthy()
  })

  it.each([
    { ...owner, canConnect: false },
    { available: false, appId: null, configId: null, canConnect: false },
  ])('stays hidden for %o', async (answer) => {
    availability.mockResolvedValue(answer)
    renderCard(Card)
    await waitFor(() => expect(availability).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByText(en.whatsappConnect.card.heading)).toBeNull()
  })

  it('stays hidden when availability cannot be read', async () => {
    availability.mockRejectedValue(new ApiError('x', 500))
    renderCard(Card)
    await waitFor(() => expect(availability).toHaveBeenCalled())
    expect(screen.queryByText(en.whatsappConnect.card.heading)).toBeNull()
  })

  it('opens the tab inside the click, then sends it to the connect page', async () => {
    const tab = fakeTab()
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as never)
    renderCard(Card)
    fireEvent.click(
      await screen.findByRole('button', {
        name: en.whatsappConnect.card.action,
      })
    )
    expect(open).toHaveBeenCalledWith('', '_blank')
    expect(tab.opener).toBeNull()
    await waitFor(() =>
      expect(tab.location.replace).toHaveBeenCalledWith(URL_WITH_TICKET)
    )
    expect(issue).toHaveBeenCalledWith('en')
    expect(await screen.findByText(en.whatsappConnect.card.opened)).toBeTruthy()
    open.mockRestore()
  })

  it('offers a direct link when the browser blocks the tab', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    renderCard(Card)
    fireEvent.click(
      await screen.findByRole('button', {
        name: en.whatsappConnect.card.action,
      })
    )
    const link = await screen.findByRole('link', {
      name: en.whatsappConnect.card.openLink,
    })
    expect(link.getAttribute('href')).toBe(URL_WITH_TICKET)
    open.mockRestore()
  })

  it('closes the tab and explains a refused ticket', async () => {
    const tab = fakeTab()
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as never)
    issue.mockRejectedValue(
      new ApiError('x', 403, 'WHATSAPP_CONNECTION_OWNER_REQUIRED')
    )
    renderCard(Card)
    fireEvent.click(
      await screen.findByRole('button', {
        name: en.whatsappConnect.card.action,
      })
    )
    expect(
      await screen.findByText(en.whatsappConnect.errors.ownerRequired)
    ).toBeTruthy()
    expect(tab.close).toHaveBeenCalled()
    expect(tab.location.replace).not.toHaveBeenCalled()
    open.mockRestore()
  })
})

describe('connect card in Arabic', () => {
  it('asks for a ticket in Arabic and shows the Arabic action', async () => {
    const tab = fakeTab()
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as never)
    renderCard(Standalone, 'ar')
    fireEvent.click(
      await screen.findByRole('button', {
        name: ar.whatsappConnect.card.action,
      })
    )
    await waitFor(() => expect(issue).toHaveBeenCalledWith('ar'))
    open.mockRestore()
  })
})
