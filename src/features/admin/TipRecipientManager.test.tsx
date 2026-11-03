import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import en from '../../../public/messages/en.json'
import ar from '../../../public/messages/ar.json'
import type { AdminTipCampaign, AdminTipOrganization } from './admin-tips.model'
import { renderAdmin } from './adminTemplatesTestUtils'
import { TipRecipientManager } from './TipRecipientManager'
import { AdminApiError } from './adminApi'

const api = vi.hoisted(() => ({
  getTipRecipients: vi.fn(),
  getTipRecipientOptions: vi.fn(),
  getTipDeliveryHistory: vi.fn(),
  changeTipRecipients: vi.fn(),
}))
vi.mock('./adminTipsApi', () => api)

const row = (
  id: string,
  overrides: Partial<AdminTipOrganization> = {}
): AdminTipOrganization => ({
  org_id: id,
  organization_name: id,
  store_name: id,
  shop_domain: null,
  platform: 'shopify',
  country_code: null,
  excluded: false,
  first_viewed_at: null,
  first_clicked_at: null,
  dismissed_at: null,
  removed_at: null,
  delivery_generation: 1,
  eligible: true,
  ...overrides,
})
const campaign = {
  id: 'c1',
  status: 'published',
  effective_status: 'published',
  revision: 4,
} as AdminTipCampaign
const labels = en.adminTips.membership

describe('TipRecipientManager', () => {
  it.each(['en', 'ar'] as const)(
    'supports the reissue confirmation and history in %s',
    async (locale) => {
      const text =
        locale === 'ar' ? ar.adminTips.membership : en.adminTips.membership
      renderAdmin(
        <TipRecipientManager
          campaign={campaign}
          refreshing={false}
          onApplied={vi.fn()}
          onRefresh={vi.fn()}
        />,
        locale
      )
      fireEvent.click(
        await screen.findByRole('checkbox', {
          name: text.selectAccount.replace('{name}', 'dismissed'),
        })
      )
      const action = text.actions.reissue.replace('{count}', '1')
      fireEvent.click(screen.getByRole('button', { name: action }))
      expect(screen.getByRole('dialog').textContent).toContain(
        text.confirm.reissue.replace('{count}', '1')
      )
      expect(document.documentElement.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr')
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: action })
      )
      await waitFor(() =>
        expect(api.changeTipRecipients).toHaveBeenCalledWith('c1', {
          revision: 4,
          operation: 'reissue',
          org_ids: ['dismissed'],
        })
      )
    }
  )
  beforeEach(() => {
    api.getTipRecipients.mockResolvedValue({
      items: [
        row('active'),
        row('dismissed', { dismissed_at: '2026-11-01T10:00:00Z' }),
        row('removed', { removed_at: '2026-11-01T10:00:00Z' }),
      ],
      next_cursor: null,
    })
    api.getTipRecipientOptions.mockResolvedValue({
      items: [row('new', { delivery_generation: null }), row('active')],
      next_cursor: null,
    })
    api.getTipDeliveryHistory.mockResolvedValue({
      items: [],
      next_before: null,
    })
    api.changeTipRecipients.mockResolvedValue({
      campaign: { ...campaign, revision: 5 },
      changed: 1,
      unchanged: 0,
    })
  })
  afterEach(() => vi.clearAllMocks())

  it('adds a selected new account only after explicit confirmation', async () => {
    const onApplied = vi.fn()
    renderAdmin(
      <TipRecipientManager
        campaign={campaign}
        refreshing={false}
        onApplied={onApplied}
        onRefresh={vi.fn()}
      />,
      'en'
    )
    fireEvent.click(screen.getByRole('button', { name: labels.findAccounts }))
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Select new' }))
    expect(
      screen.getByRole('checkbox', { name: 'Select active' })
    ).toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: 'Add accounts (1)' }))
    expect(api.changeTipRecipients).not.toHaveBeenCalled()
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Add accounts (1)',
      })
    )
    await waitFor(() =>
      expect(onApplied).toHaveBeenCalledWith({ ...campaign, revision: 5 })
    )
    expect(api.changeTipRecipients).toHaveBeenCalledWith('c1', {
      revision: 4,
      operation: 'add',
      org_ids: ['new'],
    })
  })

  it('reissues dismissed accounts and keeps failed selections available for retry', async () => {
    const warning = vi.spyOn(console, 'error').mockImplementation(() => {})
    api.changeTipRecipients.mockRejectedValueOnce(
      new AdminApiError(
        'Conflict',
        409,
        null,
        'TIPS_CAMPAIGN_REVISION_CONFLICT'
      )
    )
    renderAdmin(
      <TipRecipientManager
        campaign={campaign}
        refreshing={false}
        onApplied={vi.fn()}
        onRefresh={vi.fn()}
      />,
      'en'
    )
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Select dismissed' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Show again (1)' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toContain('unread again')
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Show again (1)' })
    )
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(
      screen.getByRole('checkbox', { name: 'Select dismissed' })
    ).toHaveProperty('checked', true)
    expect(api.changeTipRecipients).toHaveBeenCalledWith('c1', {
      revision: 4,
      operation: 'reissue',
      org_ids: ['dismissed'],
    })
    warning.mockRestore()
  })

  it('supports batch removal and exposes previous delivery history', async () => {
    api.getTipDeliveryHistory.mockResolvedValue({
      items: [
        {
          delivery_generation: 1,
          delivery_started_at: '2026-10-01T10:00:00Z',
          first_viewed_at: '2026-10-01T11:00:00Z',
          first_clicked_at: null,
          dismissed_at: '2026-10-01T12:00:00Z',
          removed_at: null,
        },
      ],
      next_before: null,
    })
    renderAdmin(
      <TipRecipientManager
        campaign={campaign}
        refreshing={false}
        onApplied={vi.fn()}
        onRefresh={vi.fn()}
      />,
      'en'
    )
    await screen.findByRole('checkbox', { name: 'Select active' })
    fireEvent.click(screen.getByRole('button', { name: labels.selectPage }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove (2)' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Remove (2)',
      })
    )
    await waitFor(() =>
      expect(api.changeTipRecipients).toHaveBeenCalledWith('c1', {
        revision: 4,
        operation: 'remove',
        org_ids: ['active', 'dismissed'],
      })
    )
    const first = screen.getAllByText(labels.history, {
      selector: 'summary',
    })[0]
    fireEvent.click(first)
    await waitFor(() => expect(api.getTipDeliveryHistory).toHaveBeenCalled())
    expect(await screen.findByText(/Delivery 1:/)).toBeTruthy()
  })

  it('keeps archived and expired campaigns read-only and explains paused visibility', async () => {
    const { unmount } = renderAdmin(
      <TipRecipientManager
        campaign={{ ...campaign, effective_status: 'expired' }}
        refreshing={false}
        onApplied={vi.fn()}
        onRefresh={vi.fn()}
      />,
      'en'
    )
    expect(
      screen.queryByRole('button', { name: labels.findAccounts })
    ).toBeNull()
    expect(screen.getByText(labels.readOnly)).toBeTruthy()
    unmount()
    renderAdmin(
      <TipRecipientManager
        campaign={{ ...campaign, status: 'paused', effective_status: 'paused' }}
        refreshing={false}
        onApplied={vi.fn()}
        onRefresh={vi.fn()}
      />,
      'en'
    )
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Select dismissed' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Show again (1)' }))
    expect(screen.getByRole('dialog').textContent).toContain(labels.pausedNote)
  })
})
