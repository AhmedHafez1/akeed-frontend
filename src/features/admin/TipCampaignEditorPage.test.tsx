import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
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
})
