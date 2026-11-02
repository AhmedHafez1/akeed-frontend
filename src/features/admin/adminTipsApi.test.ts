import { describe, expect, it, vi } from 'vitest'
import { adminRequest } from './adminApi'
import { setTipBanner } from './adminTipsApi'

vi.mock('./adminApi', () => ({ adminRequest: vi.fn() }))

describe('setTipBanner', () => {
  it('posts a boolean display setting to the encoded campaign endpoint', async () => {
    const campaign = { id: 'id/with space', show_as_banner: true }
    vi.mocked(adminRequest).mockResolvedValue(campaign)
    await expect(setTipBanner(campaign.id, true)).resolves.toEqual(campaign)
    expect(adminRequest).toHaveBeenCalledWith(
      '/api/admin/tips-campaigns/id%2Fwith%20space/banner',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"show_as_banner":true}',
      }
    )
  })
})
