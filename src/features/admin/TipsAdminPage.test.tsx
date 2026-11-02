import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../public/messages/ar.json'
import en from '../../../public/messages/en.json'
import { AdminApiError } from './adminApi'
import type { AdminTipListItem, AdminTipListResponse } from './admin-tips.model'
import { renderAdmin } from './adminTemplatesTestUtils'
import { TipsAdminPage } from './TipsAdminPage'

const api = vi.hoisted(() => ({
  getTipCampaigns: vi.fn(),
  getTipCampaign: vi.fn(),
  getTipOptions: vi.fn(),
  setTipBanner: vi.fn(),
}))
vi.mock('./adminTipsApi', () => api)
function item(
  id: string,
  status: AdminTipListItem['status'] = 'published',
  show_as_banner = false
): AdminTipListItem {
  return {
    id,
    name: id,
    type: 'tip',
    status,
    effective_status: status,
    show_as_banner,
    has_action: false,
    published_at: null,
    expires_at: null,
    created_at: '2026-11-02T10:00:00Z',
    recipient_count: null,
    analytics: { recipients: 0, viewed: 0, clicked: 0, dismissed: 0 },
  }
}

describe('TipsAdminPage banner controls', () => {
  beforeEach(() => vi.resetAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it.each(['en', 'ar'] as const)(
    'labels each switch by campaign and disables only archived states in %s',
    async (locale) => {
      api.getTipCampaigns.mockResolvedValue({
        items: [
          item('Draft', 'draft'),
          item('Published'),
          item('Paused', 'paused'),
          item('Archived', 'archived', true),
        ],
        next_cursor: null,
      })
      renderAdmin(<TipsAdminPage />, locale)
      const messages = locale === 'ar' ? ar : en
      const switches = await screen.findAllByRole('switch')
      expect(
        screen.getByRole('columnheader', {
          name: messages.adminTips.banner.column,
        })
      ).toBeTruthy()
      for (const [index, name] of [
        'Draft',
        'Published',
        'Paused',
        'Archived',
      ].entries()) {
        expect(switches[index].getAttribute('aria-label')).toBe(
          messages.adminTips.banner.label.replace('{name}', name)
        )
        expect((switches[index] as HTMLButtonElement).disabled).toBe(
          name === 'Archived'
        )
      }
      expect(switches[3].getAttribute('aria-checked')).toBe('true')
    }
  )

  it('waits for the mutation and refreshed persisted value before re-enabling', async () => {
    let finishWrite!: (value: unknown) => void
    let finishRefresh!: (value: AdminTipListResponse) => void
    api.getTipCampaigns
      .mockResolvedValueOnce({ items: [item('c1')], next_cursor: null })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishRefresh = resolve
          })
      )
    api.setTipBanner.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishWrite = resolve
        })
    )
    renderAdmin(<TipsAdminPage />, 'en')
    const toggle = await screen.findByRole('switch')
    fireEvent.click(toggle)
    expect(api.setTipBanner).toHaveBeenCalledWith('c1', true)
    expect((toggle as HTMLButtonElement).disabled).toBe(true)
    await act(async () => finishWrite({ show_as_banner: true }))
    await waitFor(() => expect(api.getTipCampaigns).toHaveBeenCalledTimes(2))
    expect((toggle as HTMLButtonElement).disabled).toBe(true)
    await act(async () =>
      finishRefresh({
        items: [item('c1', 'published', true)],
        next_cursor: null,
      })
    )
    await waitFor(() =>
      expect(toggle.getAttribute('aria-checked')).toBe('true')
    )
    expect((toggle as HTMLButtonElement).disabled).toBe(false)
  })

  it('preserves the previous setting and shows coded failures with the request id', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    api.getTipCampaigns.mockResolvedValue({
      items: [item('c1')],
      next_cursor: null,
    })
    api.setTipBanner.mockRejectedValue(
      new AdminApiError(
        'archived meanwhile',
        409,
        'req-banner',
        'TIPS_CAMPAIGN_NOT_EDITABLE'
      )
    )
    renderAdmin(<TipsAdminPage />, 'en')
    fireEvent.click(await screen.findByRole('switch'))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(
      screen.getByText(en.adminTips.errors.TIPS_CAMPAIGN_NOT_EDITABLE)
    ).toBeTruthy()
    expect(screen.getByText('req-banner')).toBeTruthy()
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'false'
    )
    expect(api.getTipCampaigns).toHaveBeenCalledTimes(1)
  })
})
