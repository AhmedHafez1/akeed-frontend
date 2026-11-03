import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import en from '../../../public/messages/en.json'
import { AdminApiError } from './adminApi'
import type {
  AdminTipCampaign,
  AdminTipOptions,
  AdminTipReview,
} from './admin-tips.model'
import { renderAdmin } from './adminTemplatesTestUtils'
import {
  TipCampaignEditorPage,
  TipCampaignNewPage,
} from './TipCampaignEditorPage'

const api = vi.hoisted(() => ({
  getTipCampaign: vi.fn(),
  getTipCampaigns: vi.fn(),
  getTipOptions: vi.fn(),
  searchTipOrganizations: vi.fn(),
  getTipRecipients: vi.fn(),
  createTipCampaign: vi.fn(),
  updateTipCampaign: vi.fn(),
  reviewTipCampaign: vi.fn(),
  publishTipCampaign: vi.fn(),
  changeTipLifecycle: vi.fn(),
  setTipBanner: vi.fn(),
  getTipRecipientOptions: vi.fn(),
  getTipDeliveryHistory: vi.fn(),
  changeTipRecipients: vi.fn(),
}))
vi.mock('./adminTipsApi', () => api)

// The merchant card's tracking must never run from the admin preview.
const tipsAuth = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  fetchWithAuth: vi.fn(),
}))
vi.mock('@/shared/lib/auth', () => tipsAuth)

const OPTIONS: AdminTipOptions = {
  locales: ['ar', 'en', 'ur', 'es', 'fr', 'tr'],
  platforms: ['shopify', 'standalone', 'easyorders', 'woocommerce'],
  plans: ['starter', 'basic', 'pro', 'business', 'prepaid'],
  message_languages: ['ar', 'en', 'ur', 'es', 'fr', 'tr', 'auto'],
  features: ['auto_cancel', 'quiet_hours'],
  action_routes: [
    { key: 'settings_timing', modes: ['embedded', 'standalone'] },
  ],
  countries: [{ country_code: 'PK', count: 3 }],
  limits: {
    name: 120,
    title: 80,
    titleLineBreaks: 1,
    description: 500,
    descriptionLineBreaks: 8,
    actionLabel: 30,
    url: 2048,
    orgList: 500,
    maxRecipients: 50000,
  },
}

function campaign(overrides: Partial<AdminTipCampaign> = {}): AdminTipCampaign {
  return {
    id: 'c1',
    name: 'Urdu templates',
    type: 'tip',
    status: 'draft',
    effective_status: 'draft',
    show_as_banner: false,
    action: null,
    expires_at: null,
    audience: {
      mode: 'filters',
      filters: { countries: ['PK'] },
      selected_org_ids: [],
      excluded_org_ids: [],
    },
    translations: [
      {
        locale: 'en',
        title: 'Try Urdu messages',
        description: 'You can offer customers a choice of language.',
        action_label: null,
      },
    ],
    revision: 2,
    review: null,
    published_at: null,
    recipient_count: null,
    paused_at: null,
    archived_at: null,
    created_at: '2026-10-20T10:00:00.000Z',
    updated_at: '2026-10-20T10:00:00.000Z',
    analytics: { recipients: 0, viewed: 0, clicked: 0, dismissed: 0 },
    ...overrides,
  }
}

const recipients = {
  items: [
    {
      org_id: 'o1',
      delivery_generation: 1,
      eligible: true,
      removed_at: null,
      organization_name: 'Lahore Org',
      store_name: 'Lahore Store',
      shop_domain: 'lahore.myshopify.com',
      platform: 'shopify',
      country_code: 'PK',
      excluded: false,
      first_viewed_at: null,
      first_clicked_at: null,
      dismissed_at: null,
    },
  ],
  next_cursor: null,
}

describe('Tips campaign editor', () => {
  beforeEach(() => {
    api.getTipRecipientOptions.mockResolvedValue({
      items: [],
      next_cursor: null,
    })
    api.getTipDeliveryHistory.mockResolvedValue({
      items: [],
      next_before: null,
    })
    api.getTipOptions.mockResolvedValue(OPTIONS)
    api.getTipRecipients.mockResolvedValue(recipients)
    api.searchTipOrganizations.mockResolvedValue({
      items: [],
      next_cursor: null,
    })
  })
  afterEach(() => vi.clearAllMocks())

  it('shows field errors instead of saving an incomplete campaign', async () => {
    renderAdmin(<TipCampaignNewPage />, 'en')
    fireEvent.click(
      screen.getByRole('button', { name: en.adminTips.editor.createDraft })
    )
    expect(await screen.findByText(en.adminTips.editor.fixErrors)).toBeTruthy()
    expect(
      screen.getAllByText(en.adminTips.issues.required).length
    ).toBeGreaterThanOrEqual(3)
    expect(api.createTipCampaign).not.toHaveBeenCalled()
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('reviews the audience, previews the card and publishes with the token', async () => {
    const draft = campaign()
    api.getTipCampaign.mockResolvedValue(draft)
    const review: AdminTipReview = {
      review_token: `2.${'a'.repeat(64)}`,
      recipient_count: 1,
      campaign: draft,
    }
    api.reviewTipCampaign.mockResolvedValue(review)
    api.publishTipCampaign.mockResolvedValue(
      campaign({ status: 'published', effective_status: 'published' })
    )
    renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')

    fireEvent.click(
      await screen.findByRole('button', { name: en.adminTips.review.review })
    )
    const preview = await screen.findByTestId('tip-preview')
    expect(within(preview).getByText('Try Urdu messages')).toBeTruthy()
    expect(await screen.findAllByText('Lahore Store')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: en.adminTips.review.publish })
    )
    fireEvent.click(
      await screen.findByRole('button', {
        name: en.adminTips.review.confirmPublish,
      })
    )
    await waitFor(() =>
      expect(api.publishTipCampaign).toHaveBeenCalledWith(
        'c1',
        review.review_token
      )
    )
    // The preview records nothing for any merchant.
    expect(tipsAuth.api.post).not.toHaveBeenCalled()
  })

  it('asks for a fresh review when the audience changed', async () => {
    const draft = campaign()
    api.getTipCampaign.mockResolvedValue(draft)
    api.reviewTipCampaign.mockResolvedValue({
      review_token: `2.${'a'.repeat(64)}`,
      recipient_count: 1,
      campaign: draft,
    })
    api.publishTipCampaign.mockRejectedValue(
      new AdminApiError(
        'changed',
        409,
        'req-9',
        'TIPS_CAMPAIGN_AUDIENCE_CHANGED',
        {
          recipient_count: 4,
        }
      )
    )
    renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')
    fireEvent.click(
      await screen.findByRole('button', { name: en.adminTips.review.review })
    )
    fireEvent.click(
      await screen.findByRole('button', { name: en.adminTips.review.publish })
    )
    fireEvent.click(
      await screen.findByRole('button', {
        name: en.adminTips.review.confirmPublish,
      })
    )
    expect(
      await screen.findByText(
        /The audience changed since your review; it now has 4 merchants/
      )
    ).toBeTruthy()
    expect(screen.queryByTestId('tip-preview')).toBeNull()
  })

  it('locks the audience and expiry of a published campaign and shows its reach', async () => {
    api.getTipCampaign.mockResolvedValue(
      campaign({
        status: 'published',
        effective_status: 'published',
        published_at: '2026-10-21T10:00:00.000Z',
        recipient_count: 3,
        analytics: { recipients: 3, viewed: 2, clicked: 0, dismissed: 1 },
      })
    )
    renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')
    expect(await screen.findByText(en.adminTips.analytics.title)).toBeTruthy()
    expect(
      (screen.getByLabelText(en.adminTips.editor.expiry) as HTMLInputElement)
        .disabled
    ).toBe(true)
    expect(
      screen.getAllByText(en.adminTips.analytics.noButton).length
    ).toBeGreaterThan(0)
    expect(
      screen.getByRole('button', { name: en.adminTips.actions.pause })
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: en.adminTips.review.review })
    ).toBeNull()
  })

  it('saves the banner immediately, waits for refresh, and preserves unsaved content', async () => {
    const draft = campaign()
    let finishWrite!: (value: AdminTipCampaign) => void
    let finishRefresh!: (value: AdminTipCampaign) => void
    api.getTipCampaign.mockResolvedValueOnce(draft).mockImplementationOnce(
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
    renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')
    const toggle = await screen.findByRole('switch')
    const name = screen.getByLabelText(
      en.adminTips.editor.name
    ) as HTMLInputElement
    fireEvent.change(name, { target: { value: 'Unsaved name' } })
    fireEvent.click(toggle)
    expect(api.setTipBanner).toHaveBeenCalledWith('c1', true)
    expect((toggle as HTMLButtonElement).disabled).toBe(true)
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    await act(async () => finishWrite(campaign({ show_as_banner: true })))
    await waitFor(() => expect(api.getTipCampaign).toHaveBeenCalledTimes(2))
    expect((toggle as HTMLButtonElement).disabled).toBe(true)
    await act(async () => finishRefresh(campaign({ show_as_banner: true })))
    await waitFor(() =>
      expect(toggle.getAttribute('aria-checked')).toBe('true')
    )
    expect(name.value).toBe('Unsaved name')
    expect(screen.getByText(en.adminTips.editor.unsaved)).toBeTruthy()
    expect(api.updateTipCampaign).not.toHaveBeenCalled()
    expect(api.reviewTipCampaign).not.toHaveBeenCalled()
    expect(toggle.getAttribute('aria-describedby')).toBeTruthy()
  })

  it('preserves unsaved text across recipient revision changes and saves with the new revision', async () => {
    const published = campaign({
      status: 'published',
      effective_status: 'published',
      published_at: '2026-11-01T10:00:00Z',
    })
    const changed = { ...published, revision: 3 }
    api.getTipCampaign
      .mockResolvedValueOnce(published)
      .mockResolvedValue(changed)
    api.getTipRecipients.mockResolvedValue({
      ...recipients,
      items: recipients.items.map((row) => ({
        ...row,
        dismissed_at: '2026-11-01T11:00:00Z',
      })),
    })
    api.changeTipRecipients.mockResolvedValue({
      campaign: changed,
      changed: 1,
      unchanged: 0,
    })
    api.updateTipCampaign.mockResolvedValue({
      ...changed,
      name: 'Unsaved name',
      revision: 4,
    })
    renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')
    const name = (await screen.findByLabelText(
      en.adminTips.editor.name
    )) as HTMLInputElement
    fireEvent.change(name, { target: { value: 'Unsaved name' } })
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Select Lahore Store' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Show again (1)' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Show again (1)',
      })
    )
    await waitFor(() => expect(api.getTipCampaign).toHaveBeenCalledTimes(2))
    expect(name.value).toBe('Unsaved name')
    fireEvent.click(
      screen.getByRole('button', { name: en.adminTips.editor.save })
    )
    await waitFor(() =>
      expect(api.updateTipCampaign).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ revision: 3, name: 'Unsaved name' })
      )
    )
  })

  it('keeps unsaved content when a campaign refresh fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const draft = campaign()
    api.getTipCampaign
      .mockResolvedValueOnce(draft)
      .mockRejectedValueOnce(new Error('Offline'))
    api.setTipBanner.mockResolvedValue({ ...draft, show_as_banner: true })
    renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')
    const name = (await screen.findByLabelText(
      en.adminTips.editor.name
    )) as HTMLInputElement
    fireEvent.change(name, { target: { value: 'Keep these edits' } })
    fireEvent.click(screen.getByRole('switch'))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(name.value).toBe('Keep these edits')
    expect(screen.getByLabelText(en.adminTips.editor.name)).toBe(name)
    error.mockRestore()
  })

  it('retains the content revision if a recipient response includes another admin’s content edits', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const published = campaign({
      status: 'published',
      effective_status: 'published',
      published_at: '2026-11-01T10:00:00Z',
    })
    const concurrent = {
      ...published,
      name: 'Another admin’s name',
      revision: 4,
    }
    api.getTipCampaign
      .mockResolvedValueOnce(published)
      .mockResolvedValue(concurrent)
    api.getTipRecipients.mockResolvedValue({
      ...recipients,
      items: recipients.items.map((row) => ({
        ...row,
        dismissed_at: '2026-11-01T11:00:00Z',
      })),
    })
    api.changeTipRecipients.mockResolvedValue({
      campaign: concurrent,
      changed: 1,
      unchanged: 0,
    })
    api.updateTipCampaign.mockRejectedValue(
      new AdminApiError(
        'Conflict',
        409,
        null,
        'TIPS_CAMPAIGN_REVISION_CONFLICT'
      )
    )
    renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')
    const name = (await screen.findByLabelText(
      en.adminTips.editor.name
    )) as HTMLInputElement
    fireEvent.change(name, { target: { value: 'Keep my draft' } })
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Select Lahore Store' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Show again (1)' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Show again (1)',
      })
    )
    await waitFor(() => expect(api.getTipCampaign).toHaveBeenCalledTimes(2))
    fireEvent.click(
      screen.getByRole('button', { name: en.adminTips.editor.save })
    )
    await waitFor(() =>
      expect(api.updateTipCampaign).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ revision: 2, name: 'Keep my draft' })
      )
    )
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(name.value).toBe('Keep my draft')
    error.mockRestore()
  })

  it('keeps the existing review and publish token after toggling', async () => {
    const draft = campaign()
    const token = `2.${'b'.repeat(64)}`
    api.getTipCampaign
      .mockResolvedValueOnce(draft)
      .mockResolvedValue(campaign({ show_as_banner: true }))
    api.reviewTipCampaign.mockResolvedValue({
      review_token: token,
      recipient_count: 1,
      campaign: draft,
    })
    api.setTipBanner.mockResolvedValue(campaign({ show_as_banner: true }))
    api.publishTipCampaign.mockResolvedValue(
      campaign({
        status: 'published',
        effective_status: 'published',
        show_as_banner: true,
      })
    )
    renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')
    fireEvent.click(
      await screen.findByRole('button', { name: en.adminTips.review.review })
    )
    await screen.findByTestId('tip-preview')
    fireEvent.click(screen.getByRole('switch'))
    await waitFor(() =>
      expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
        'true'
      )
    )
    expect(screen.getByTestId('tip-preview')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: en.adminTips.review.publish })
    )
    fireEvent.click(
      await screen.findByRole('button', {
        name: en.adminTips.review.confirmPublish,
      })
    )
    await waitFor(() =>
      expect(api.publishTipCampaign).toHaveBeenCalledWith('c1', token)
    )
    expect(api.reviewTipCampaign).toHaveBeenCalledTimes(1)
  })

  it.each(['published', 'paused', 'archived'] as const)(
    'only locks the banner on an archived %s campaign',
    async (status) => {
      api.getTipCampaign.mockResolvedValue(
        campaign({ status, effective_status: status, show_as_banner: true })
      )
      renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')
      const toggle = await screen.findByRole('switch')
      expect(toggle.getAttribute('aria-checked')).toBe('true')
      expect((toggle as HTMLButtonElement).disabled).toBe(status === 'archived')
    }
  )

  it('retains the previous setting and allows retry after a failed write', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    api.getTipCampaign.mockResolvedValue(campaign())
    api.setTipBanner.mockRejectedValueOnce(
      new AdminApiError('offline', 0, null)
    )
    renderAdmin(<TipCampaignEditorPage id="c1" />, 'en')
    fireEvent.click(await screen.findByRole('switch'))
    expect(await screen.findByText(en.adminTips.banner.error)).toBeTruthy()
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'false'
    )
    expect((screen.getByRole('switch') as HTMLButtonElement).disabled).toBe(
      false
    )
    expect(api.getTipCampaign).toHaveBeenCalledTimes(1)
    api.setTipBanner.mockResolvedValueOnce(campaign({ show_as_banner: true }))
    api.getTipCampaign.mockResolvedValue(campaign({ show_as_banner: true }))
    fireEvent.click(screen.getByRole('switch'))
    await waitFor(() =>
      expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
        'true'
      )
    )
    expect(screen.queryByRole('alert')).toBeNull()
    log.mockRestore()
  })
})
