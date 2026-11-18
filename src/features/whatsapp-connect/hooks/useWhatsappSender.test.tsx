import { act, renderHook } from '@testing-library/react'
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getWhatsappConnection,
  getWhatsappSender,
} from '../api/whatsappConnectApi'
import {
  availabilityFixture,
  connectionFixture,
  templateFixture,
} from '../testing/whatsappFixtures'
import { useWhatsappSenderData } from './useWhatsappSender'

vi.mock('../api/whatsappConnectApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/whatsappConnectApi')>()),
  getWhatsappConnection: vi.fn(),
  getWhatsappSender: vi.fn(),
}))
const connection = vi.mocked(getWhatsappConnection)
const sender = vi.mocked(getWhatsappSender)
let client: QueryClient
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}
beforeEach(() => {
  vi.useFakeTimers()
  focusManager.setFocused(true)
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  sender.mockReset().mockResolvedValue(availabilityFixture())
  connection.mockReset().mockResolvedValue({
    connection: connectionFixture({
      templateDetails: [templateFixture('x', 'en', { status: 'pending' })],
    }),
  })
})
afterEach(() => {
  client.clear()
  focusManager.setFocused(undefined)
  vi.useRealTimers()
})

describe('foreground WhatsApp status refresh', () => {
  it('refreshes both answers every 15 seconds while pending and stops once approved', async () => {
    renderHook(() => useWhatsappSenderData(true, true), { wrapper })
    await tick(20)
    expect(connection).toHaveBeenCalledTimes(1)
    await tick(15_000)
    expect(connection).toHaveBeenCalledTimes(2)
    expect(sender).toHaveBeenCalledTimes(2)
    connection.mockResolvedValue({ connection: connectionFixture() })
    await tick(15_000)
    const count = connection.mock.calls.length
    const senderCount = sender.mock.calls.length
    await tick(30_000)
    expect(connection).toHaveBeenCalledTimes(count)
    expect(sender).toHaveBeenCalledTimes(senderCount)
  })
  it('pauses while hidden and refreshes immediately on focus', async () => {
    renderHook(() => useWhatsappSenderData(true, true), { wrapper })
    await tick(20)
    act(() => focusManager.setFocused(false))
    await tick(45_000)
    expect(connection).toHaveBeenCalledTimes(1)
    expect(sender).toHaveBeenCalledTimes(1)
    act(() => focusManager.setFocused(true))
    await tick(20)
    expect(connection).toHaveBeenCalledTimes(2)
    expect(sender).toHaveBeenCalledTimes(2)
  })
  it('refreshes on reopening WhatsApp settings even within the cache freshness window', async () => {
    connection.mockResolvedValue({ connection: connectionFixture() })
    const view = renderHook(() => useWhatsappSenderData(true, true), {
      wrapper,
    })
    await tick(20)
    view.unmount()
    renderHook(() => useWhatsappSenderData(true, true), { wrapper })
    await tick(20)
    expect(connection).toHaveBeenCalledTimes(2)
    expect(sender).toHaveBeenCalledTimes(2)
  })
})
