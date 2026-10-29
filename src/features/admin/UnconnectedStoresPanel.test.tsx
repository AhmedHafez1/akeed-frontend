import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UnconnectedStoresPanel } from './UnconnectedStoresPanel'

const auth = vi.hoisted(() => ({ fetchWithAuth: vi.fn() }))

vi.mock('@/shared/lib/auth', () => auth)

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('UnconnectedStoresPanel', () => {
  beforeEach(() => auth.fetchWithAuth.mockReset())

  it('lists stores whose orders are skipped for lack of an integration', async () => {
    auth.fetchWithAuth.mockResolvedValue(
      json(200, {
        data: [
          {
            platform: 'shopify',
            shop_domain: 'orphan.myshopify.com',
            skipped_events: 430,
            unique_orders: 215,
            unique_orders_7d: 84,
            first_received_at: '2026-10-09T04:12:04Z',
            last_received_at: '2026-10-29T14:09:53Z',
          },
        ],
      })
    )

    render(<UnconnectedStoresPanel />)

    expect(
      await screen.findByRole('heading', {
        name: 'Orders from unconnected stores (1)',
      })
    ).toBeTruthy()
    expect(screen.getByText('orphan.myshopify.com')).toBeTruthy()
    expect(screen.getByText('215')).toBeTruthy()
    expect(screen.getByText('84')).toBeTruthy()
    expect(auth.fetchWithAuth).toHaveBeenCalledWith(
      '/api/admin/stores/unconnected',
      expect.anything()
    )
  })

  it('renders nothing when every sending store is connected', async () => {
    auth.fetchWithAuth.mockResolvedValue(json(200, { data: [] }))

    const { container } = render(<UnconnectedStoresPanel />)

    await waitFor(() => expect(auth.fetchWithAuth).toHaveBeenCalled())
    expect(container.innerHTML).toBe('')
  })

  it('says so when the list cannot be loaded', async () => {
    auth.fetchWithAuth.mockResolvedValue(json(500, { message: 'down' }))

    render(<UnconnectedStoresPanel />)

    expect(
      await screen.findByText('Unconnected stores could not be loaded.')
    ).toBeTruthy()
  })
})
